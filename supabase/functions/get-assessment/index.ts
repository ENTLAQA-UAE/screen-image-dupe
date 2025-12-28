import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const isGroupLink = url.searchParams.get("isGroupLink") === "true";

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let assessmentGroup: any;
    let participant: any = null;
    let assessment: any;

    if (isGroupLink) {
      // Group link: find assessment group by group_link_token
      const { data: group, error: groupError } = await supabase
        .from("assessment_groups")
        .select("*, assessments(*)")
        .eq("group_link_token", token)
        .maybeSingle();

      if (groupError || !group) {
        console.error("Group not found:", groupError);
        return new Response(
          JSON.stringify({ error: "Invalid assessment link" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      assessmentGroup = group;
      assessment = group.assessments;
    } else {
      // Participant link: find participant by access_token
      const { data: part, error: partError } = await supabase
        .from("participants")
        .select("*, assessment_groups(*, assessments(*))")
        .eq("access_token", token)
        .maybeSingle();

      if (partError || !part) {
        console.error("Participant not found:", partError);
        return new Response(
          JSON.stringify({ error: "Invalid assessment link" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      participant = part;
      assessmentGroup = part.assessment_groups;
      assessment = assessmentGroup?.assessments;
    }

    if (!assessmentGroup || !assessment) {
      return new Response(
        JSON.stringify({ error: "Assessment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch organization for branding (needed for all responses including errors)
    const { data: org } = await supabase
      .from("organizations")
      .select("name, logo_url, primary_color, primary_language")
      .eq("id", assessmentGroup.organization_id)
      .maybeSingle();

    const organizationData = org ? {
      id: assessmentGroup.organization_id,
      name: org.name,
      logoUrl: org.logo_url,
      primaryColor: org.primary_color,
      language: org.primary_language,
    } : null;

    const assessmentInfo = {
      title: assessment.title,
      language: assessment.language,
    };

    // Check if group is active
    if (!assessmentGroup.is_active) {
      console.log("Assessment group is closed:", assessmentGroup.id);
      return new Response(
        JSON.stringify({ 
          error: "This assessment is no longer active", 
          status: "closed",
          organization: organizationData,
          assessment: assessmentInfo,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check date window
    const now = new Date();
    if (assessmentGroup.start_date && new Date(assessmentGroup.start_date) > now) {
      console.log("Assessment not started yet:", assessmentGroup.id, "starts:", assessmentGroup.start_date);
      return new Response(
        JSON.stringify({ 
          error: "This assessment has not started yet",
          status: "not_started",
          startDate: assessmentGroup.start_date,
          organization: organizationData,
          assessment: assessmentInfo,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (assessmentGroup.end_date && new Date(assessmentGroup.end_date) < now) {
      console.log("Assessment expired:", assessmentGroup.id, "ended:", assessmentGroup.end_date);
      return new Response(
        JSON.stringify({ 
          error: "This assessment has ended", 
          status: "expired",
          endDate: assessmentGroup.end_date,
          organization: organizationData,
          assessment: assessmentInfo,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if participant already completed
    if (participant?.status === "completed") {
      // Return results if allowed
      const config = assessment.config || {};
      if (config.showResultsToEmployee) {
        return new Response(
          JSON.stringify({
            status: "completed",
            showResults: true,
            participant: {
              id: participant.id,
              full_name: participant.full_name,
              email: participant.email,
              employee_code: participant.employee_code,
              department: participant.department,
              score_summary: participant.score_summary,
              ai_report_text: participant.ai_report_text,
              completed_at: participant.completed_at,
            },
            assessment: {
              id: assessment.id,
              title: assessment.title,
              type: assessment.type,
              language: assessment.language,
              is_graded: assessment.is_graded,
            },
            assessmentGroup: {
              id: assessmentGroup.id,
              name: assessmentGroup.name,
            },
            organization: organizationData,
            allowPdfDownload: config.allowEmployeePdfDownload || false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            status: "completed", 
            showResults: false,
            organization: organizationData,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch questions
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("id, type, text, options, order_index")
      .eq("assessment_id", assessment.id)
      .order("order_index", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return new Response(
        JSON.stringify({ error: "Failed to load questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const questions = questionsData || [];

    // Update participant status to started if not already
    if (participant && participant.status === "invited") {
      await supabase
        .from("participants")
        .update({ status: "started", started_at: new Date().toISOString() })
        .eq("id", participant.id);
    }

    const response = {
      status: "ready",
      requiresRegistration: isGroupLink && !participant,
      assessmentGroup: {
        id: assessmentGroup.id,
        name: assessmentGroup.name,
        organizationId: assessmentGroup.organization_id,
      },
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        language: assessment.language,
        is_graded: assessment.is_graded,
        config: {
          showResultsToEmployee: assessment.config?.showResultsToEmployee || false,
          aiFeedbackEnabled: assessment.config?.aiFeedbackEnabled || false,
          timeLimit: assessment.config?.timeLimit || null,
          allowEmployeePdfDownload: assessment.config?.allowEmployeePdfDownload || false,
        },
      },
      questions: questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        options: q.options,
      })),
      organization: organizationData,
      participant: participant ? {
        id: participant.id,
        full_name: participant.full_name,
      } : null,
    };

    console.log("Assessment access granted:", { 
      assessmentId: assessment.id, 
      participantId: participant?.id,
      questionsCount: questions.length 
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in get-assessment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
