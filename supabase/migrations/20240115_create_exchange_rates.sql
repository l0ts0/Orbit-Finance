-- Create a table to store the latest exchange rates
create table if not exists exchange_rates (
  currency text primary key,
  rate numeric not null,
  last_updated timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table exchange_rates enable row level security;

-- Create a policy that allows anyone to read the rates
create policy "Public rates are viewable by everyone"
  on exchange_rates for select
  using ( true );

-- Create a policy that allows service role (Edge Function) to update rates
create policy "Service role can update rates"
  on exchange_rates for all
  using ( auth.role() = 'service_role' );

-- Insert default rates
insert into exchange_rates (currency, rate) values
  ('TWD', 1),
  ('USD', 0.0307),
  ('JPY', 4.7)
on conflict (currency) do nothing;
