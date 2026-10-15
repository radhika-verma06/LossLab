-- LossLab production-oriented relational model. The local demo never connects to Supabase.
create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- An explicit membership fact is required for every tenant-scoped RLS read.
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'engineer', 'analyst', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members(user_id, organization_id);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  adapter_kind text not null check (adapter_kind in ('sdk', 'webhook', 'raw_trace', 'synthetic_fixture')),
  description text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);
create index agents_organization_active_idx on public.agents(organization_id, created_at desc) where archived_at is null;

-- Policy sets are immutable by version. Published policy data is not updated in place.
create table public.policy_sets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null,
  name text not null,
  version integer not null check (version > 0),
  state text not null check (state in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (organization_id, agent_id) references public.agents(organization_id, id) on delete cascade,
  unique (organization_id, agent_id, name, version),
  unique (organization_id, id)
);
create index policy_sets_agent_version_idx on public.policy_sets(organization_id, agent_id, name, version desc);

create table public.policy_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  policy_set_id uuid not null,
  rule_key text not null check (length(trim(rule_key)) between 1 and 120),
  title text not null,
  rule_type text not null check (rule_type in ('amount_threshold', 'approval', 'idempotency', 'action_permission', 'time_window', 'discount_stack', 'currency', 'retry_budget', 'source_trust', 'payment_release')),
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (organization_id, policy_set_id) references public.policy_sets(organization_id, id) on delete cascade,
  unique (policy_set_id, rule_key)
);
create index policy_rules_organization_set_idx on public.policy_rules(organization_id, policy_set_id) where enabled;

create table public.simulation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null,
  policy_set_id uuid not null,
  mode text not null check (mode in ('synthetic_demo', 'customer_trace')),
  seed bigint not null check (seed >= 0),
  volume_multiplier numeric(4, 2) not null check (volume_multiplier between 0.50 and 2.00),
  status text not null check (status in ('queued', 'running', 'complete', 'failed', 'cancelled')),
  currency char(3) not null default 'USD',
  monthly_exposure_cents bigint not null default 0 check (monthly_exposure_cents >= 0),
  annualized_exposure_cents bigint generated always as (monthly_exposure_cents * 12) stored,
  assumptions jsonb not null check (jsonb_typeof(assumptions) = 'object'),
  fixture_hash text not null,
  requested_by uuid not null references auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (organization_id, agent_id) references public.agents(organization_id, id),
  foreign key (organization_id, policy_set_id) references public.policy_sets(organization_id, id),
  unique (organization_id, id)
);
create index simulation_runs_org_recent_idx on public.simulation_runs(organization_id, created_at desc);
create index simulation_runs_agent_policy_idx on public.simulation_runs(organization_id, agent_id, policy_set_id, created_at desc);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  simulation_run_id uuid not null,
  case_key text not null,
  scenario_name text not null,
  category text not null check (category in ('Policy Breach', 'Prompt Injection', 'Economic Manipulation', 'Escalation Loop')),
  severity text not null check (severity in ('Low', 'Medium', 'High', 'Critical')),
  fixture_hash text not null,
  user_message text not null,
  agent_response text not null,
  expected_action text not null,
  observed_action text not null,
  action_trace jsonb not null check (jsonb_typeof(action_trace) = 'array'),
  monthly_affected_events integer not null check (monthly_affected_events >= 0),
  unit_economic_impact_cents bigint not null check (unit_economic_impact_cents >= 0),
  modeled_monthly_cents bigint generated always as (monthly_affected_events::bigint * unit_economic_impact_cents) stored,
  created_at timestamptz not null default now(),
  foreign key (organization_id, simulation_run_id) references public.simulation_runs(organization_id, id) on delete cascade,
  unique (simulation_run_id, case_key)
);
create index scenarios_run_category_idx on public.scenarios(organization_id, simulation_run_id, category);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  simulation_run_id uuid not null,
  scenario_id uuid not null,
  rule_key text not null,
  result text not null check (result in ('pass', 'fail', 'blocked')),
  observed text not null,
  expected text not null,
  evidence jsonb not null check (jsonb_typeof(evidence) = 'array'),
  proposed_guardrail text,
  created_at timestamptz not null default now(),
  foreign key (organization_id, simulation_run_id) references public.simulation_runs(organization_id, id) on delete cascade,
  foreign key (scenario_id) references public.scenarios(id) on delete cascade,
  unique (scenario_id, rule_key)
);
create index findings_run_result_idx on public.findings(organization_id, simulation_run_id, result, created_at);
create index findings_rule_idx on public.findings(organization_id, rule_key, created_at desc);

create table public.remediation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  baseline_run_id uuid not null,
  policy_set_id uuid not null,
  guardrail_ids text[] not null default '{}',
  efficacy_basis_points integer not null check (efficacy_basis_points between 0 and 10000),
  baseline_monthly_cents bigint not null check (baseline_monthly_cents >= 0),
  prevented_cents bigint not null check (prevented_cents >= 0),
  residual_cents bigint not null check (residual_cents >= 0),
  assumptions jsonb not null check (jsonb_typeof(assumptions) = 'object'),
  run_result jsonb not null check (jsonb_typeof(run_result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (organization_id, baseline_run_id) references public.simulation_runs(organization_id, id) on delete cascade,
  foreign key (organization_id, policy_set_id) references public.policy_sets(organization_id, id),
  constraint remediation_reconciles check (baseline_monthly_cents = prevented_cents + residual_cents)
);
create index remediation_org_run_idx on public.remediation_runs(organization_id, baseline_run_id, created_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null check (length(trim(event_type)) between 1 and 120),
  resource_type text not null,
  resource_id uuid,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);
create index audit_events_org_recent_idx on public.audit_events(organization_id, created_at desc);
create index audit_events_resource_idx on public.audit_events(organization_id, resource_type, resource_id, created_at desc);

-- RLS: require an explicit authenticated org membership; no demo-wide permissive policies.
create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql stable security invoker
set search_path = public, auth
as $$
  select exists (
    select 1 from public.organization_members member
    where member.organization_id = target_organization
      and member.user_id = auth.uid()
  );
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.agents enable row level security;
alter table public.policy_sets enable row level security;
alter table public.policy_rules enable row level security;
alter table public.simulation_runs enable row level security;
alter table public.scenarios enable row level security;
alter table public.findings enable row level security;
alter table public.remediation_runs enable row level security;
alter table public.audit_events enable row level security;

create policy organizations_read_member on public.organizations for select to authenticated using (public.is_organization_member(id));
create policy organization_members_read_member on public.organization_members for select to authenticated using (public.is_organization_member(organization_id));
create policy agents_read_member on public.agents for select to authenticated using (public.is_organization_member(organization_id));
create policy agents_insert_admin on public.agents for insert to authenticated with check (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = agents.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin')
  )
);
create policy agents_update_admin on public.agents for update to authenticated using (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = agents.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin')
  )
) with check (public.is_organization_member(organization_id));
create policy policy_sets_read_member on public.policy_sets for select to authenticated using (public.is_organization_member(organization_id));
create policy policy_sets_insert_engineer on public.policy_sets for insert to authenticated with check (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = policy_sets.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin', 'engineer')
  )
);
create policy policy_rules_read_member on public.policy_rules for select to authenticated using (public.is_organization_member(organization_id));
create policy policy_rules_insert_engineer on public.policy_rules for insert to authenticated with check (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = policy_rules.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin', 'engineer')
  )
);
create policy simulation_runs_read_member on public.simulation_runs for select to authenticated using (public.is_organization_member(organization_id));
create policy simulation_runs_insert_operator on public.simulation_runs for insert to authenticated with check (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = simulation_runs.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin', 'engineer', 'analyst')
  )
);
create policy scenarios_read_member on public.scenarios for select to authenticated using (public.is_organization_member(organization_id));
create policy findings_read_member on public.findings for select to authenticated using (public.is_organization_member(organization_id));
create policy remediation_runs_read_member on public.remediation_runs for select to authenticated using (public.is_organization_member(organization_id));
create policy remediation_runs_insert_operator on public.remediation_runs for insert to authenticated with check (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = remediation_runs.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin', 'engineer', 'analyst')
  )
);
create policy audit_events_read_admin on public.audit_events for select to authenticated using (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = audit_events.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin')
  )
);

-- Child rows are tenant-bound through composite foreign keys and their organization_id policies.
create policy scenarios_insert_operator on public.scenarios for insert to authenticated with check (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = scenarios.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin', 'engineer', 'analyst')
  )
);
create policy findings_insert_operator on public.findings for insert to authenticated with check (
  public.is_organization_member(organization_id) and exists (
    select 1 from public.organization_members member where member.organization_id = findings.organization_id and member.user_id = auth.uid() and member.role in ('owner', 'admin', 'engineer', 'analyst')
  )
);
create policy audit_events_insert_member on public.audit_events for insert to authenticated with check (
  actor_user_id = auth.uid() and public.is_organization_member(organization_id)
);

-- No delete policies for immutable runs, scenarios, findings, policy definitions, or audit events.
