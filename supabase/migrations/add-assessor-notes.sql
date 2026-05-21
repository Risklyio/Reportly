-- Run in Supabase SQL Editor if assessment_controls already exists without assessor_notes
alter table assessment_controls
  add column if not exists assessor_notes text not null default '';
