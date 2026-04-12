import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate auth
    const authHeader = req.headers.get("authorization") || "";
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user?.id) {
      console.error("Auth validation failed:", userError?.message || "No user");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", userData.user.id);

    const { groupId } = await req.json();

    if (!groupId) {
      return new Response(
        JSON.stringify({ error: "Group ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch group with assessment and organization
    const { data: group, error: groupError } = await supabase
      .from("assessment_groups")
      .select(`
        id, name, start_date, end_date,
        organization:organizations(id, name, primary_language),
        assessment:assessments(id, title, type, is_graded, description)
      `)
      .eq("id", groupId)
      .maybeSingle();

    if (groupError || !group) {
      console.error("Group fetch error:", groupError);
      return new Response(
        JSON.stringify({ error: "Group not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all completed participants with their scores
    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select("id, full_name, email, employee_code, department, status, score_summary, ai_report_text, completed_at")
      .eq("group_id", groupId)
      .order("completed_at", { ascending: false });

    if (participantsError) {
      console.error("Participants fetch error:", participantsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch participants" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const completedParticipants = participants?.filter(p => p.status === "completed") || [];
    const totalParticipants = participants?.length || 0;

    if (completedParticipants.length === 0) {
      return new Response(
        JSON.stringify({ 
          narrative: "No completed assessments yet. The group narrative will be available once participants complete their assessments.",
          stats: { total: totalParticipants, completed: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate comprehensive statistics
    const assessment = group.assessment as any;
    const isGraded = assessment?.is_graded;
    const language = (group.organization as any)?.primary_language || 'en';

    let statsDescription = "";
    let scoreDetails = "";

    if (isGraded) {
      // Graded assessment statistics
      const scores = completedParticipants
        .map(p => p.score_summary?.percentage)
        .filter((s): s is number => typeof s === "number");

      if (scores.length > 0) {
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const median = scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)];

        // Grade distribution
        const grades: Record<string, number> = {};
        completedParticipants.forEach(p => {
          const grade = p.score_summary?.grade;
          if (grade) grades[grade] = (grades[grade] || 0) + 1;
        });

        statsDescription = `
Assessment Type: Graded Assessment
Completion Rate: ${completedParticipants.length} of ${totalParticipants} (${Math.round((completedParticipants.length / totalParticipants) * 100)}%)
Score Statistics:
- Average Score: ${avgScore}%
- Highest Score: ${highestScore}%
- Lowest Score: ${lowestScore}%
- Median Score: ${median}%
Grade Distribution: ${Object.entries(grades).map(([g, c]) => `${g}: ${c}`).join(", ")}
`;

        // Include individual performance context
        const topPerformers = completedParticipants
          .filter(p => (p.score_summary?.percentage || 0) >= 80)
          .map(p => p.full_name || "Anonymous");
        
        const needsImprovement = completedParticipants
          .filter(p => (p.score_summary?.percentage || 0) < 50)
          .map(p => p.full_name || "Anonymous");

        scoreDetails = `
Top Performers (80%+): ${topPerformers.length} participants
Needs Improvement (<50%): ${needsImprovement.length} participants
`;
      }
    } else {
      // Trait-based assessment statistics
      const allTraits: Record<string, number[]> = {};
      
      completedParticipants.forEach(p => {
        const traits = p.score_summary?.traits;
        if (traits && typeof traits === "object") {
          Object.entries(traits).forEach(([trait, score]) => {
            if (typeof score === "number") {
              if (!allTraits[trait]) allTraits[trait] = [];
              allTraits[trait].push(score);
            }
          });
        }
      });

      if (Object.keys(allTraits).length > 0) {
        const traitAverages = Object.entries(allTraits).map(([trait, scores]) => ({
          trait,
          average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
          highest: Math.max(...scores),
          lowest: Math.min(...scores),
        }));

        statsDescription = `
Assessment Type: Personality/Trait Profile Assessment
Completion Rate: ${completedParticipants.length} of ${totalParticipants} (${Math.round((completedParticipants.length / totalParticipants) * 100)}%)
Trait Analysis:
${traitAverages.map(t => `- ${t.trait}: Average ${t.average}/5 (Range: ${t.lowest}-${t.highest})`).join("\n")}
`;

        // Identify dominant traits
        const sortedTraits = [...traitAverages].sort((a, b) => b.average - a.average);
        scoreDetails = `
Strongest Group Traits: ${sortedTraits.slice(0, 3).map(t => `${t.trait} (${t.average})`).join(", ")}
Areas for Development: ${sortedTraits.slice(-3).map(t => `${t.trait} (${t.average})`).join(", ")}
`;
      }
    }

    // Build the AI prompt
    const prompt = language === 'ar' 
      ? `أنت محلل موارد بشرية خبير. اكتب تقريرًا تحليليًا شاملاً باللغة العربية لمجموعة التقييم التالية.

اسم المجموعة: ${group.name}
التقييم: ${assessment?.title || "غير محدد"}
الوصف: ${assessment?.description || "غير متوفر"}

الإحصائيات:
${statsDescription}
${scoreDetails}

اكتب تقريرًا من 3-4 فقرات يتضمن:
1. ملخص تنفيذي للنتائج
2. تحليل الأداء العام للمجموعة
3. نقاط القوة والمجالات التي تحتاج للتطوير
4. توصيات للتحسين والخطوات التالية

اكتب بأسلوب مهني وموضوعي.`
      : `You are an expert HR analyst. Write a comprehensive analytical report for the following assessment group.

Group Name: ${group.name}
Assessment: ${assessment?.title || "Unknown"}
Description: ${assessment?.description || "Not available"}

Statistics:
${statsDescription}
${scoreDetails}

Write a 3-4 paragraph report that includes:
1. Executive summary of findings
2. Analysis of overall group performance
3. Key strengths and areas for development
4. Recommendations for improvement and next steps

Write in a professional, objective tone suitable for HR leadership. Be specific and actionable.`;

    console.log("Generating group narrative with prompt:", prompt.substring(0, 200) + "...");

    // Call Lovable AI Gateway
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
            content: language === 'ar' 
              ? "أنت محلل موارد بشرية خبير متخصص في تحليل نتائج التقييمات وتقديم رؤى قابلة للتنفيذ."
              : "You are an expert HR analyst specializing in assessment analysis and providing actionable insights." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate narrative" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const narrative = aiData.choices?.[0]?.message?.content || "Unable to generate narrative.";

    console.log("Successfully generated group narrative");

    return new Response(
      JSON.stringify({
        narrative,
        stats: {
          total: totalParticipants,
          completed: completedParticipants.length,
          completionRate: Math.round((completedParticipants.length / totalParticipants) * 100),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-group-narrative:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
