-- Add change24h column to holdings table
alter table holdings 
add column if not exists change24h numeric default 0;

-- Allow authenticated users to update exchange_rates
-- This allows manual refresh from the client to persist to DB
create policy "Authenticated users can update rates"
  on exchange_rates for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert rates"
  on exchange_rates for insert
  with check ( auth.role() = 'authenticated' );
