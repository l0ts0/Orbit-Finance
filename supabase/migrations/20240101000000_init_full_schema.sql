-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Holdings Table
create table if not exists holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  ticker text,
  type text not null,
  price numeric default 0,
  quantity numeric default 0,
  currency text default 'TWD',
  color text,
  bill_day integer,
  last_updated timestamptz,
  created_at timestamptz default now()
);

alter table holdings enable row level security;

create policy "Users can all holdings" on holdings
  for all using (auth.uid() = user_id);

-- Transactions Table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null,
  date timestamptz not null,
  amount numeric not null,
  category text,
  note text,
  source_asset_id text,
  source_asset_name text,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "Users can all transactions" on transactions
  for all using (auth.uid() = user_id);

-- Categories Table
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  label text not null,
  icon text,
  color text,
  keywords text[] default '{}',
  created_at timestamptz default now()
);

alter table categories enable row level security;

create policy "Users can all categories" on categories
  for all using (auth.uid() = user_id);

-- System Logs Table (Moved up)
create table if not exists system_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date timestamptz,
  title text,
  description text,
  status text,
  amount text,
  created_at timestamptz default now()
);

alter table system_logs enable row level security;

create policy "Users can all system_logs" on system_logs
  for all using (auth.uid() = user_id);

-- Automations Table
create table if not exists automations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text,
  type text,
  amount numeric,
  currency text,
  day_of_month integer,
  category text,
  transaction_type text,
  target_asset_id text,
  source_asset_id text,
  invest_asset_id text,
  active boolean default true,
  last_run text,
  created_at timestamptz default now()
);

alter table automations enable row level security;

create policy "Users can all automations" on automations
  for all using (auth.uid() = user_id);
