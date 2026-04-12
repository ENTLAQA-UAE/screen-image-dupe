import { type NextRequest, NextResponse } from 'next/server';

import { sendEmail } from '@/lib/email/service';
import { renderEmailTemplate } from '@/lib/email/templates';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Cron: Send assessment reminders.
 *
 * Checks for groups with deadlines approaching (3 days, 1 day, 4 hours)
 * and sends reminder emails to participants who haven't completed yet.
 *
 * Schedule: every hour
 * vercel.json: { "path": "/api/cron/send-reminders", "schedule": "0 * * * *" }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  let sentCount = 0;
  let errorCount = 0;

  // Find groups with deadlines within the next 3 days that have
  // incomplete participants who haven't been reminded recently
  const { data: groups } = await supabase
    .from('assessment_groups')
    .select(
      'id, organization_id, name, end_date, group_link_token, assessments!inner(id, title, language)',
    )
    .eq('is_active', true)
    .not('end_date', 'is', null)
    .gte('end_date', now.toISOString())
    .lte(
      'deadline',
      new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    );

  if (!groups || groups.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      errors: 0,
      message: 'No groups with approaching deadlines',
    });
  }

  for (const group of groups) {
    const g = group as unknown as {
      id: string;
      organization_id: string;
      name: string;
      end_date: string;
      group_link_token: string;
      assessments: { id: string; title: string; language: string | null };
    };

    const deadline = new Date(g.end_date);
    const hoursLeft = Math.round(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const daysLeft = Math.round(hoursLeft / 24);

    // Only send at key intervals: 3 days, 1 day, 4 hours
    const shouldRemind =
      (daysLeft === 3 && hoursLeft >= 71 && hoursLeft <= 73) ||
      (daysLeft === 1 && hoursLeft >= 23 && hoursLeft <= 25) ||
      (hoursLeft >= 3 && hoursLeft <= 5);

    if (!shouldRemind) continue;

    // Get incomplete participants
    const { data: participants } = await supabase
      .from('participants')
      .select('id, full_name, email')
      .eq('group_id', g.id)
      .in('status', ['invited', 'active']);

    if (!participants || participants.length === 0) continue;

    // Get org name for the template
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', g.organization_id)
      .single();

    const orgName = (org as { name: string } | null)?.name ?? 'Your organization';
    const language = (g.assessments.language as 'en' | 'ar') ?? 'en';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://qudurat.com';
    const assessmentUrl = `${appUrl}/assess/${g.group_link_token}`;

    for (const participant of participants) {
      const p = participant as unknown as {
        id: string;
        full_name: string;
        email: string;
      };

      const { subject, html, text } = renderEmailTemplate(
        'reminder',
        {
          recipientName: p.full_name,
          recipientEmail: p.email,
          organizationName: orgName,
          assessmentTitle: g.assessments.title,
          assessmentUrl,
          groupName: g.name,
          daysRemaining: daysLeft,
          hoursRemaining: hoursLeft,
        },
        language,
      );

      const result = await sendEmail(
        g.organization_id,
        { to: p.email, subject, html, text },
        'reminder',
      );

      if (result.success) {
        sentCount++;
      } else {
        errorCount++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent: sentCount,
    errors: errorCount,
    at: now.toISOString(),
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
