-- Schedule daily subscription email notifications via pg_cron
-- Runs every day at 8:00 AM UTC
-- Calls the send-subscription-emails edge function to check for:
-- - Trials expiring in 3 days
-- - Trials expiring in 1 day
-- - Trials that just expired
-- - Past-due payments

-- Note: pg_cron must be enabled in your Supabase project settings.
-- If pg_cron is not available, this migration will be skipped gracefully.

DO $$
BEGIN
  -- Check if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule the daily email notification job
    PERFORM cron.schedule(
      'send-subscription-emails',
      '0 8 * * *',  -- Every day at 8:00 AM UTC
      $$
      SELECT net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-subscription-emails',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
      $$
    );

    RAISE NOTICE 'Subscription email cron job scheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron not available — skipping cron job setup. Enable pg_cron in Supabase dashboard and re-run.';
  END IF;
END $$;
