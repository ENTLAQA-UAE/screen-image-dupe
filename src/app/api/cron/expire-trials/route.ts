import { type NextRequest, NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/server';

/**
 * Cron endpoint: transition expired trials to past_due.
 *
 * Protected by CRON_SECRET header — set this in Vercel project env and
 * configure Vercel Cron Jobs (vercel.json) to hit this route hourly.
 *
 * vercel.json:
 * {
 *   "crons": [
 *     { "path": "/api/cron/expire-trials", "schedule": "0 * * * *" }
 *   ]
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('expire_trial_subscriptions');

  if (error) {
    console.error('[cron/expire-trials] failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    expired: data ?? 0,
    at: new Date().toISOString(),
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
