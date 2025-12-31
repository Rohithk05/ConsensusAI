-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Scenarios Table
create table scenarios (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  title text not null,
  description text,
  module text not null check (module in ('general', 'vendor_eval', 'roadmap_prd', 'policy_compliance', 'project_planning')),
  constraints jsonb not null, -- { budget, timeline, qualityMin, riskMax }
  priorities jsonb not null, -- { budget, timeline, quality, risk }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents Table
create table documents (
  id uuid default uuid_generate_v4() primary key,
  scenario_id uuid references scenarios(id) on delete cascade,
  name text not null,
  type text not null, -- 'contract', 'rfp', 'policy', 'spec'
  storage_path text, -- Path in Supabase Storage bucket
  upload_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('processing', 'ready', 'error')) default 'processing',
  extracted_facts jsonb -- Array of { field, value, confidence, originalText }
);

-- Vendors Table (for vendor_eval)
create table vendors (
  id uuid default uuid_generate_v4() primary key,
  scenario_id uuid references scenarios(id) on delete cascade,
  vendor_name text not null,
  document_id uuid references documents(id),
  metrics jsonb not null, -- { budget, timeline, quality, risk }
  extracted_facts jsonb -- Array of facts
);

-- Negotiations Table
create table negotiations (
  id uuid default uuid_generate_v4() primary key,
  scenario_id uuid references scenarios(id) on delete cascade,
  status text check (status in ('active', 'converged', 'failed')) default 'active',
  current_round int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Negotiation Rounds Table (Summaries)
create table negotiation_rounds (
  id uuid default uuid_generate_v4() primary key,
  negotiation_id uuid references negotiations(id) on delete cascade,
  round_number int not null,
  summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Agent Responses Table
create table agent_responses (
  id uuid default uuid_generate_v4() primary key,
  negotiation_round_id uuid references negotiation_rounds(id) on delete cascade,
  agent_role text not null, -- 'budget', 'timeline', 'quality', 'risk', 'coordinator'
  decision text check (decision in ('accept', 'reject', 'propose')),
  content text,
  modifications jsonb,
  evidence jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table scenarios enable row level security;
alter table documents enable row level security;
alter table vendors enable row level security;
alter table negotiations enable row level security;
alter table negotiation_rounds enable row level security;
alter table agent_responses enable row level security;

-- Scenarios policies
create policy "Users can CRUD their own scenarios" on scenarios
  for all using (auth.uid() = user_id);

-- Documents policies
create policy "Users can CRUD documents for their scenarios" on documents
  for all using (
    exists (select 1 from scenarios where id = documents.scenario_id and user_id = auth.uid())
  );

-- Vendors policies
create policy "Users can CRUD vendors for their scenarios" on vendors
  for all using (
    exists (select 1 from scenarios where id = vendors.scenario_id and user_id = auth.uid())
  );

-- Negotiations policies
create policy "Users can see negotiations for their scenarios" on negotiations
  for all using (
    exists (select 1 from scenarios where id = negotiations.scenario_id and user_id = auth.uid())
  );

-- Rounds policies
create policy "Users can see rounds for their negotiations" on negotiation_rounds
  for all using (
    exists (
      select 1 from negotiations 
      join scenarios on scenarios.id = negotiations.scenario_id 
      where negotiations.id = negotiation_rounds.negotiation_id 
      and scenarios.user_id = auth.uid()
    )
  );

-- Agent Responses policies
create policy "Users can see responses for their negotiations" on agent_responses
  for all using (
    exists (
      select 1 from negotiation_rounds
      join negotiations on negotiations.id = negotiation_rounds.negotiation_id
      join scenarios on scenarios.id = negotiations.scenario_id
      where negotiation_rounds.id = agent_responses.negotiation_round_id
      and scenarios.user_id = auth.uid()
    )
  );
