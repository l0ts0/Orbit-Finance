-- Add destination fields to transactions table for transfers
alter table transactions 
add column if not exists destination_asset_id text,
add column if not exists destination_asset_name text;
