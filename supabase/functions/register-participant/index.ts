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
    const { 
      groupToken, 
      fullName, 
      email, 
      employeeCode, 
      department, 
      jobTitle 
    } = await req.json();

    // Validate required fields
    if (!groupToken || !fullName || !email || !employeeCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the assessment group by token
    const { data: group, error: groupError } = await supabase
      .from("assessment_groups")
      .select("id, organization_id, is_active, start_date, end_date")
      .eq("group_link_token", groupToken)
      .maybeSingle();

    if (groupError || !group) {
      console.error("Group not found:", groupError);
      return new Response(
        JSON.stringify({ error: "Invalid assessment link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if group is active
    if (!group.is_active) {
      return new Response(
        JSON.stringify({ error: "Assessment is no longer active", code: "INACTIVE" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check date window
    const now = new Date();
    if (group.start_date && new Date(group.start_date) > now) {
      return new Response(
        JSON.stringify({ error: "Assessment has not started yet", code: "NOT_STARTED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (group.end_date && new Date(group.end_date) < now) {
      return new Response(
        JSON.stringify({ error: "Assessment has ended", code: "EXPIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if employee code already used for this group
    const { data: existingByCode } = await supabase
      .from("participants")
      .select("id, status")
      .eq("group_id", group.id)
      .eq("employee_code", employeeCode.trim())
      .maybeSingle();

    if (existingByCode) {
      return new Response(
        JSON.stringify({ error: "Employee code already used", code: "DUPLICATE_CODE" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already used for this group
    const { data: existingByEmail } = await supabase
      .from("participants")
      .select("id, status")
      .eq("group_id", group.id)
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existingByEmail) {
      return new Response(
        JSON.stringify({ error: "Email already used", code: "DUPLICATE_EMAIL" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a new participant ID
    const newParticipantId = crypto.randomUUID();

    // Insert the participant
    const { error: insertError } = await supabase
      .from("participants")
      .insert({
        id: newParticipantId,
        group_id: group.id,
        organization_id: group.organization_id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        department: department?.trim() || null,
        job_title: jobTitle?.trim() || null,
        employee_code: employeeCode.trim(),
        status: "started",
        started_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      
      // Handle unique constraint violation
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Already registered", code: "DUPLICATE" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw insertError;
    }

    console.log("Participant registered:", { participantId: newParticipantId, groupId: group.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        participantId: newParticipantId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Registration failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
