-- Refresh operational security controls after sub-control split (1A, 1B, etc.)
-- Run in Supabase SQL Editor if you already seeded the old 30 ops controls.
-- WARNING: Deletes operational control rows; re-seed from app via npm run supabase:setup
-- or re-insert from lib/db/seed-data after clearing.

delete from assessment_controls
where control_id like 'ops-%'
  and control_id ~ '^ops-[0-9]+$';

delete from controls where domain_id = 'operational_security';

-- Then run: npm run supabase:setup
-- (or redeploy and hit /api/setup with SETUP_SECRET on a fresh project)
