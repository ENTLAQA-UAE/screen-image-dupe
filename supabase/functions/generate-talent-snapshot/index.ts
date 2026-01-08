import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TalentSnapshotRequest {
  employeeEmail: string;
  organizationId: string;
  forceRegenerate?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeEmail, organizationId, forceRegenerate }: TalentSnapshotRequest = await req.json();

    if (!employeeEmail || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for cached snapshot first (unless forceRegenerate is true)
    if (!forceRegenerate) {
      const { data: cachedSnapshot, error: cacheError } = await supabase
        .from("employee_talent_snapshots")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("employee_email", employeeEmail)
        .maybeSingle();

      if (!cacheError && cachedSnapshot) {
        console.log("Returning cached snapshot for:", employeeEmail);
        return new Response(
          JSON.stringify({
            snapshot: cachedSnapshot.snapshot_text,
            assessmentCount: cachedSnapshot.assessment_count,
            generatedAt: cachedSnapshot.generated_at,
            cached: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch all completed assessments for this employee
    const { data: participants, error: fetchError } = await supabase
      .from("participants")
      .select(`
        *,
        assessment_groups!inner (
          name,
          assessments!inner (title, type, is_graded)
        )
      `)
      .eq("organization_id", organizationId)
      .eq("email", employeeEmail)
      .eq("status", "completed");

    if (fetchError) {
      console.error("Error fetching participants:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch assessment data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!participants || participants.length === 0) {
      return new Response(
        JSON.stringify({ error: "No completed assessments found for this employee" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build assessment summary for the prompt
    const assessmentSummaries = participants.map((p: any) => {
      const assessment = p.assessment_groups?.assessments;
      const summary: any = {
        type: assessment?.type || "unknown",
        title: assessment?.title || "Unknown",
      };

      if (p.score_summary?.percentage !== undefined) {
        summary.score = `${p.score_summary.percentage}%`;
        summary.grade = p.score_summary.grade;
      }

      if (p.score_summary?.traits) {
        summary.traits = Object.entries(p.score_summary.traits)
          .map(([trait, score]) => `${trait}: ${score}/5`)
          .join(", ");
      }

      return summary;
    });

    const employeeName = participants[0]?.full_name || "Employee";
    const department = participants[0]?.department || "Not specified";
    const jobTitle = participants[0]?.job_title || "Not specified";

    // Build prompt for AI
    const prompt = `Generate a comprehensive "Talent Snapshot" profile summary for ${employeeName}.

Employee Information:
- Department: ${department}
- Job Title: ${jobTitle}
- Total Assessments Completed: ${participants.length}

Assessment Results:
${assessmentSummaries.map((s: any, i: number) => `
${i + 1}. ${s.title} (${s.type})
   ${s.score ? `Score: ${s.score} (Grade: ${s.grade})` : ''}
   ${s.traits ? `Traits: ${s.traits}` : ''}
`).join('')}

Please provide:
1. **Executive Summary** (2-3 sentences capturing the overall talent profile)
2. **Key Strengths** (3-4 bullet points of standout capabilities)
3. **Development Areas** (2-3 areas for potential growth)
4. **Role Fit Insights** (What types of roles/responsibilities they excel at)
5. **Team Contribution** (How they might contribute to team dynamics)

Keep the tone professional, constructive, and actionable. Total length should be around 250-300 words.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating talent snapshot for:", employeeEmail);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are an expert HR talent analyst. Generate insightful, professional talent profiles based on assessment data. Format your response with clear sections using markdown headers (##)." 
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate talent snapshot" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const snapshot = aiData.choices?.[0]?.message?.content || "";
    const generatedAt = new Date().toISOString();

    // Cache the snapshot using upsert
    const { error: upsertError } = await supabase
      .from("employee_talent_snapshots")
      .upsert({
        organization_id: organizationId,
        employee_email: employeeEmail,
        snapshot_text: snapshot,
        assessment_count: participants.length,
        generated_at: generatedAt,
      }, {
        onConflict: "organization_id,employee_email",
      });

    if (upsertError) {
      console.error("Error caching snapshot:", upsertError);
      // Continue even if caching fails
    } else {
      console.log("Talent snapshot cached successfully");
    }

    console.log("Talent snapshot generated successfully");

    return new Response(
      JSON.stringify({ 
        snapshot, 
        assessmentCount: participants.length,
        generatedAt,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-talent-snapshot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
