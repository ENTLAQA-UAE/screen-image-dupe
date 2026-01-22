import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecalculateRequest {
  groupId?: string;
  participantId?: string;
  organizationId?: string;
}

// SJT category to score mapping (fallback for legacy data)
const sjtCategoryMap: Record<string, number> = {
  "Most Effective": 4,
  "Effective": 3,
  "Ineffective": 2,
  "Least Effective": 1,
};

function getOptionScore(opt: any): number {
  if (typeof opt.score === 'number') return opt.score;
  if (opt.score_category) return sjtCategoryMap[opt.score_category] ?? 0;
  return 0;
}

function getGrade(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { groupId, participantId, organizationId }: RecalculateRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query for participants to recalculate
    let query = supabase
      .from("participants")
      .select("*, assessment_groups(*, assessments(*))")
      .eq("status", "completed");

    if (participantId) {
      query = query.eq("id", participantId);
    } else if (groupId) {
      query = query.eq("group_id", groupId);
    } else if (organizationId) {
      query = query.eq("organization_id", organizationId);
    } else {
      return new Response(
        JSON.stringify({ error: "Must provide groupId, participantId, or organizationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: participants, error: partError } = await query;

    if (partError) {
      console.error("Error fetching participants:", partError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch participants" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let recalculatedCount = 0;
    let skippedCount = 0;
    const results: any[] = [];

    for (const participant of participants || []) {
      const assessment = participant.assessment_groups?.assessments;
      
      // Skip if not a graded assessment
      if (!assessment?.is_graded) {
        skippedCount++;
        continue;
      }

      // Get all responses for this participant
      const { data: responses, error: respError } = await supabase
        .from("responses")
        .select("*, questions(*)")
        .eq("participant_id", participant.id);

      if (respError || !responses?.length) {
        skippedCount++;
        continue;
      }

      // Check if any questions are SJT type
      const hasSjtQuestions = responses.some((r: any) => {
        const q = r.questions;
        return q?.type === 'sjt_ranking' || 
          (q?.options && Array.isArray(q.options) && q.options.length > 0 && 
           (q.options[0]?.score !== undefined || q.options[0]?.score_category));
      });

      if (!hasSjtQuestions) {
        skippedCount++;
        continue;
      }

      // Recalculate scores
      let totalScore = 0;
      let totalPossible = 0;
      let correctCount = 0;

      for (const response of responses) {
        const question = response.questions;
        if (!question) continue;

        const answerValue = response.answer_data?.value;
        if (answerValue === undefined || answerValue === null) continue;

        const isSjtQuestion = question.type === 'sjt_ranking' || 
          (question.options && Array.isArray(question.options) && question.options.length > 0 && 
           (question.options[0]?.score !== undefined || question.options[0]?.score_category));

        if (isSjtQuestion) {
          const selectedIndex = typeof answerValue === "number" ? answerValue : parseInt(answerValue);
          const selectedOption = question.options?.[selectedIndex];
          
          if (selectedOption && question.options) {
            const maxScore = Math.max(...question.options.map(getOptionScore));
            const selectedScore = getOptionScore(selectedOption);
            
            totalScore += selectedScore;
            totalPossible += maxScore;
            
            const isCorrect = selectedScore === maxScore;
            if (isCorrect) {
              correctCount += 1;
            }

            // Update the response record
            await supabase
              .from("responses")
              .update({
                is_correct: isCorrect,
                score_value: selectedScore,
              })
              .eq("id", response.id);
          }
        } else if (question.correct_answer) {
          // MCQ - keep existing logic
          const correctIndex = question.correct_answer?.index;
          if (correctIndex !== undefined) {
            const isCorrect = answerValue === correctIndex;
            totalPossible += 1;
            if (isCorrect) {
              correctCount += 1;
              totalScore += 1;
            }
          }
        }
      }

      // Calculate new score summary
      const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      const newScoreSummary = {
        totalScore,
        totalPossible,
        correctCount,
        percentage,
        grade: getGrade(percentage),
        recalculatedAt: new Date().toISOString(),
      };

      // Update participant
      const { error: updateError } = await supabase
        .from("participants")
        .update({ score_summary: newScoreSummary })
        .eq("id", participant.id);

      if (!updateError) {
        recalculatedCount++;
        results.push({
          participantId: participant.id,
          name: participant.full_name,
          oldSummary: participant.score_summary,
          newSummary: newScoreSummary,
        });
      }
    }

    console.log(`Recalculated ${recalculatedCount} participants, skipped ${skippedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        recalculatedCount,
        skippedCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in recalculate-sjt-scores:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
