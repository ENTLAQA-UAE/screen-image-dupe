import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateQuestionsRequest {
  assessmentType: string;
  category: "graded_quiz" | "profile";
  language: "en" | "ar";
  description: string;
  questionCount: number;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  config?: Record<string, any>;
}

const TYPE_PROMPTS: Record<string, string> = {
  cognitive: `You are an expert in cognitive assessment design. Generate questions that measure:
- Numerical reasoning (math problems, data interpretation)
- Verbal reasoning (vocabulary, reading comprehension, analogies)
- Logical reasoning (patterns, sequences, deductions)
- Spatial reasoning (mental rotation, visualization)

Each question should have 4 options with one correct answer. Vary difficulty based on the request.`,

  personality: `You are an expert in personality psychology. Generate personality assessment items based on the Big Five model:
- Openness (creativity, curiosity, intellectual interests)
- Conscientiousness (organization, dependability, self-discipline)
- Extraversion (sociability, assertiveness, positive emotions)
- Agreeableness (cooperation, trust, empathy)
- Neuroticism (emotional stability, anxiety, moodiness)

Use Likert scale (1-5: Strongly Disagree to Strongly Agree). There are no "correct" answers - each option maps to trait scores.`,

  behavioral: `You are an expert in behavioral assessment (Functional Behavioral Assessment style). Generate questions that measure:
- Antecedents (triggers and contexts for behaviors)
- Behaviors (observable actions and patterns)
- Consequences (outcomes and reinforcements)
- Frequency (how often behaviors occur)

Questions should help identify workplace behavior patterns. Use Likert scales or multiple choice.`,

  situational: `You are an expert in Situational Judgment Test (SJT) design. Generate realistic workplace scenarios that measure:
- Decision-making under pressure
- Teamwork and collaboration
- Leadership and initiative
- Customer service orientation
- Integrity and ethics

Each scenario should present 4-5 response options. Rate options as Most Effective, Effective, Ineffective, or Least Effective.

CRITICAL FOR REPORTING:
- Each generated question MUST include metadata.subdomain set to EXACTLY one competency name from the provided "Target these competencies" list.
- Distribute questions as evenly as possible across the competencies list.
- Do NOT invent new competency names.`,

  language: `You are an expert in English language assessment. Generate questions that measure:
- Grammar (sentence structure, verb tenses, articles)
- Vocabulary (word meaning, synonyms, usage in context)
- Reading comprehension (passages with questions)

Each question should have 4 options with one correct answer. Target the specified proficiency level.`,

  generic_quiz: `You are an expert assessment designer. Generate knowledge-based quiz questions based on the description provided. Each question should have 4 options with one correct answer.`,

  generic_profile: `You are an expert in profile assessment design. Generate items that create a profile or score distribution based on the traits/dimensions described. Use Likert scales (1-5). There are no "correct" answers.`,
};

// Helper function to generate a batch of questions
async function generateQuestionBatch(
  LOVABLE_API_KEY: string,
  systemPrompt: string,
  userPrompt: string,
  batchSize: number
): Promise<any[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (response.status === 402) {
      throw new Error("CREDITS_EXHAUSTED");
    }
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from AI");
  }

  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```\n?$/g, "").trim();
  }
  
  return JSON.parse(jsonStr);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= Authentication Check =============
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("Auth validation failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Question generation requested by user:", claimsData.claims.sub);
    // ============= End Authentication Check =============

    const { 
      assessmentType, 
      category, 
      language, 
      description, 
      questionCount, 
      difficulty = "mixed",
      config = {} 
    }: GenerateQuestionsRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const typePrompt = TYPE_PROMPTS[assessmentType] || TYPE_PROMPTS.generic_quiz;
    const isGraded = category === "graded_quiz";
    const langInstruction = language === "ar" 
      ? "Generate ALL content in Modern Standard Arabic. Ensure proper grammar and professional language."
      : "Generate all content in clear, professional English.";

    // Build config-specific instructions
    let configInstructions = "";
    if (config.subdomains?.length) {
      configInstructions += `\nFocus on these subdomains: ${config.subdomains.join(", ")}`;
    }
    if (config.traits?.length) {
      configInstructions += `\nMeasure these traits: ${config.traits.join(", ")}`;
    }
    if (config.competencies?.length) {
      // Support both string array (legacy) and object array with descriptions
      const competencyList = config.competencies.map((c: any) => {
        if (typeof c === "string") return c;
        return c.description ? `${c.name} (${c.description})` : c.name;
      });
      const competencyNames = config.competencies.map((c: any) => 
        typeof c === "string" ? c : c.name
      );
      configInstructions += `\nTarget these competencies:\n${competencyList.join("\n")}`;
      configInstructions += `\n\nIMPORTANT: Use ONLY these exact competency names for subdomain: ${competencyNames.join(", ")}`;
    }
    if (config.skills?.length) {
      configInstructions += `\nAssess these skills: ${config.skills.join(", ")}`;
    }
    if (config.proficiencyLevel) {
      configInstructions += `\nTarget proficiency level: ${config.proficiencyLevel}`;
    }

    const systemPrompt = `${typePrompt}

${langInstruction}

IMPORTANT: Return ONLY valid JSON array with no markdown formatting, no code blocks, no explanation.

Each question object must have:
- "text": the question text
- "type": one of "mcq_single", "mcq_multi", "likert", "sjt_ranking"
- "options": array of option objects, each with "text" and optionally "value" (for Likert) or "score" (for personality traits)
${isGraded ? '- "correctAnswer": index of the correct option (0-based) for graded questions' : '- "scoringLogic": object mapping option indices to trait/scale scores'}
- "metadata": object with "difficulty" (easy/medium/hard), and:
  - for situational/SJT questions: "subdomain" MUST be one of the provided competencies
  - for cognitive: "subdomain" can be a subdomain
  - for profile: "trait" should be used

Example for graded MCQ:
{"text": "What is 15 × 8?", "type": "mcq_single", "options": [{"text": "100"}, {"text": "120"}, {"text": "115"}, {"text": "125"}], "correctAnswer": 1, "metadata": {"difficulty": "easy", "subdomain": "numerical"}}

Example for personality Likert:
{"text": "I enjoy meeting new people", "type": "likert", "options": [{"text": "Strongly Disagree", "value": 1}, {"text": "Disagree", "value": 2}, {"text": "Neutral", "value": 3}, {"text": "Agree", "value": 4}, {"text": "Strongly Agree", "value": 5}], "scoringLogic": {"trait": "extraversion", "direction": "positive"}, "metadata": {"trait": "extraversion"}}`;

    console.log("Generating questions with prompt:", { assessmentType, questionCount, difficulty, config });

    // For large question counts, batch the requests to avoid timeout
    const BATCH_SIZE = 15;
    let allQuestions: any[] = [];
    
    if (questionCount <= BATCH_SIZE) {
      // Single request for small counts
      const userPrompt = `Generate exactly ${questionCount} questions for the following assessment:

Description: ${description}
Difficulty level: ${difficulty}
${configInstructions}

Return ONLY the JSON array, no other text.`;

      allQuestions = await generateQuestionBatch(LOVABLE_API_KEY, systemPrompt, userPrompt, questionCount);
    } else {
      // Batch requests for larger counts
      const numBatches = Math.ceil(questionCount / BATCH_SIZE);
      console.log(`Generating ${questionCount} questions in ${numBatches} batches`);
      
      for (let i = 0; i < numBatches; i++) {
        const batchSize = Math.min(BATCH_SIZE, questionCount - (i * BATCH_SIZE));
        const batchNumber = i + 1;
        
        const userPrompt = `Generate exactly ${batchSize} questions for the following assessment (batch ${batchNumber} of ${numBatches}):

Description: ${description}
Difficulty level: ${difficulty}
${configInstructions}

${i > 0 ? `Note: This is a continuation. Generate NEW questions different from previous batches.` : ''}

Return ONLY the JSON array, no other text.`;

        try {
          const batchQuestions = await generateQuestionBatch(LOVABLE_API_KEY, systemPrompt, userPrompt, batchSize);
          allQuestions = [...allQuestions, ...batchQuestions];
          console.log(`Batch ${batchNumber}: Generated ${batchQuestions.length} questions`);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message === "RATE_LIMIT") {
              return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            if (error.message === "CREDITS_EXHAUSTED") {
              return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
                status: 402,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
          throw error;
        }
      }
    }

    if (!allQuestions || allQuestions.length === 0) {
      throw new Error("No questions generated");
    }

    // Validate and normalize questions
    const normalizedQuestions = allQuestions.map((q: any, index: number) => {
      const meta = q.metadata || {};
      // Tolerate common alternative key from LLMs ("competency") and normalize to subdomain
      const normalizedSubdomain = meta.subdomain || meta.competency || undefined;

      return {
      text: q.text || "",
      type: q.type || "mcq_single",
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      scoringLogic: q.scoringLogic,
      metadata: {
        ...meta,
        ...(normalizedSubdomain ? { subdomain: normalizedSubdomain } : {}),
        orderIndex: index,
      },
      };
    });

    console.log(`Generated ${normalizedQuestions.length} questions successfully`);

    return new Response(JSON.stringify({ questions: normalizedQuestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
