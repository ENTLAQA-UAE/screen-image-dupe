import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitRequest {
  participantId: string;
  assessmentId: string;
  answers: Array<{
    questionId: string;
    value: any;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { participantId, assessmentId, answers }: SubmitRequest = await req.json();

    if (!participantId || !assessmentId || !answers?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify participant exists and hasn't completed
    const { data: participant, error: partError } = await supabase
      .from("participants")
      .select("*, assessment_groups(*, assessments(*))")
      .eq("id", participantId)
      .maybeSingle();

    if (partError || !participant) {
      console.error("Participant not found:", partError);
      return new Response(
        JSON.stringify({ error: "Participant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (participant.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Assessment already submitted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assessment = participant.assessment_groups?.assessments;
    if (!assessment || assessment.id !== assessmentId) {
      return new Response(
        JSON.stringify({ error: "Assessment mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch questions with correct answers
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("assessment_id", assessmentId);

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return new Response(
        JSON.stringify({ error: "Failed to load questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const questionMap = new Map(questions?.map((q: any) => [q.id, q]) || []);
    
    // Process answers and calculate scores
    let totalScore = 0;
    let totalPossible = 0;
    let correctCount = 0;
    const traitScores: Record<string, { score: number; count: number }> = {};

    const responsesToInsert = answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) return null;

      let isCorrect: boolean | null = null;
      let scoreValue: number | null = null;

      if (assessment.is_graded && question.correct_answer) {
        // Graded assessment - check correct answer
        const correctIndex = question.correct_answer?.index;
        if (correctIndex !== undefined) {
          isCorrect = answer.value === correctIndex;
          scoreValue = isCorrect ? 1 : 0;
          totalPossible += 1;
          if (isCorrect) {
            correctCount += 1;
            totalScore += 1;
          }
        }
      } else if (question.correct_answer?.trait) {
        // Profile/Personality - aggregate trait scores
        const trait = question.correct_answer.trait;
        const direction = question.correct_answer.direction || "positive";
        const value = typeof answer.value === "number" ? answer.value : parseInt(answer.value) || 0;
        const adjustedValue = direction === "negative" ? (6 - value) : value;
        
        if (!traitScores[trait]) {
          traitScores[trait] = { score: 0, count: 0 };
        }
        traitScores[trait].score += adjustedValue;
        traitScores[trait].count += 1;
        scoreValue = adjustedValue;
      }

      return {
        participant_id: participantId,
        question_id: answer.questionId,
        answer_data: { value: answer.value },
        is_correct: isCorrect,
        score_value: scoreValue,
      };
    }).filter(Boolean);

    // Insert responses
    if (responsesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("responses")
        .insert(responsesToInsert);

      if (insertError) {
        console.error("Error inserting responses:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save responses" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build score summary
    let scoreSummary: Record<string, any> = {};
    
    if (assessment.is_graded) {
      const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      scoreSummary = {
        totalScore,
        totalPossible,
        correctCount,
        percentage,
        grade: getGrade(percentage),
      };
    } else {
      // Calculate trait averages
      const traitAverages: Record<string, number> = {};
      for (const [trait, data] of Object.entries(traitScores)) {
        traitAverages[trait] = data.count > 0 ? Math.round((data.score / data.count) * 100) / 100 : 0;
      }
      scoreSummary = {
        traits: traitAverages,
      };
    }

    // Generate AI report if enabled
    let aiReportText = null;
    const config = assessment.config || {};
    
    if (config.aiFeedbackEnabled) {
      try {
        aiReportText = await generateAIReport(assessment, scoreSummary);
      } catch (aiError) {
        console.error("AI report generation failed:", aiError);
        // Continue without AI report
      }
    }

    // Update participant status to completed
    const { error: updateError } = await supabase
      .from("participants")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        score_summary: scoreSummary,
        ai_report_text: aiReportText,
      })
      .eq("id", participantId);

    if (updateError) {
      console.error("Error updating participant:", updateError);
    }

    console.log("Assessment submitted:", { 
      participantId, 
      assessmentId, 
      responsesCount: responsesToInsert.length,
      scoreSummary 
    });

    // Return results if allowed
    const showResults = config.showResultsToEmployee || false;

    return new Response(
      JSON.stringify({
        success: true,
        showResults,
        results: showResults ? {
          scoreSummary,
          aiReport: aiReportText,
          allowPdfDownload: config.allowEmployeePdfDownload || false,
        } : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in submit-assessment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getGrade(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

async function generateAIReport(assessment: any, scoreSummary: any): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const isGraded = assessment.is_graded;
  const language = assessment.language || "en";

  let prompt = "";
  if (isGraded) {
    prompt = `Generate a brief, encouraging feedback report for an employee who completed a ${assessment.type} assessment.
Score: ${scoreSummary.percentage}% (${scoreSummary.correctCount}/${scoreSummary.totalPossible} correct)
Grade: ${scoreSummary.grade}

Provide:
1. A summary of their performance
2. Key strengths observed
3. Areas for improvement
4. Encouragement for next steps

Keep it professional, constructive, and under 200 words.
${language === "ar" ? "Write the entire response in Arabic." : ""}`;
  } else {
    const traits = scoreSummary.traits || {};
    const traitList = Object.entries(traits)
      .map(([trait, score]) => `${trait}: ${score}/5`)
      .join(", ");

    prompt = `Generate a personality/behavioral profile summary for an employee.
Assessment type: ${assessment.type}
Trait scores (out of 5): ${traitList}

Provide:
1. Overview of their profile
2. Key strengths
3. Potential areas for development
4. How these traits might manifest in the workplace

Keep it professional, insightful, and under 200 words.
${language === "ar" ? "Write the entire response in Arabic." : ""}`;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are an HR assessment specialist who provides constructive, professional feedback on assessment results." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
