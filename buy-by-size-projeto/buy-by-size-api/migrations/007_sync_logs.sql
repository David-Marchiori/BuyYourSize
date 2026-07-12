create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  status text not null check (status in ('success', 'error')),
  details text,
  created_at timestamptz not null default now()
);

create index if not exists sync_logs_store_id_created_at_idx
  on public.sync_logs(store_id, created_at desc);
