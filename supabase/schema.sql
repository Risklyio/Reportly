-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists frameworks (
  id text primary key,
  name text not null,
  description text
);

create table if not exists domains (
  id text primary key,
  framework_id text not null references frameworks(id),
  label text not null,
  short_label text not null,
  sort_order int not null
);

create table if not exists controls (
  id text primary key,
  domain_id text not null references domains(id),
  number int not null,
  title text not null,
  section text not null,
  hard_fail boolean not null default false,
  intent text not null,
  evidence_requirements text not null,
  doc_url text not null,
  default_not_in_place_reasons text not null,
  corrective_action_hints text not null
);

create table if not exists assessments (
  id text primary key,
  framework_id text not null references frameworks(id),
  client_name text not null,
  app_name text not null,
  assessment_date text not null,
  assessor_name text not null default '',
  scope_notes text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assessment_controls (
  assessment_id text not null references assessments(id) on delete cascade,
  control_id text not null references controls(id),
  outcome text,
  not_in_place_reason text not null default '',
  assessor_notes text not null default '',
  corrective_action text not null default '',
  evidence_notes text not null default '',
  pci_expected_testing_done text not null default '[]',
  pci_expected_testing_comments text not null default '[]',
  updated_at timestamptz not null default now(),
  primary key (assessment_id, control_id)
);

create table if not exists templates (
  id text primary key,
  name text not null,
  filename text not null,
  storage_path text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists user_corrective_overrides (
  id text primary key,
  control_id text not null,
  reason_code text not null,
  action_text text not null,
  links text not null default '[]',
  created_at timestamptz not null default now()
);

-- Storage bucket (create in Dashboard → Storage, or via API):
-- Name: reportly-templates, Public: false (service role uploads/downloads)
