create table if not exists public.store_config (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  xml_url text,
  update_frequency integer not null default 24,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
