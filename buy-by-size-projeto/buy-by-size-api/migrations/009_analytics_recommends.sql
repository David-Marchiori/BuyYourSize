create table if not exists public.analytics_recommends (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id text not null,
  sugestao text,
  tipo_tabela text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_recommends_store_id_created_at_idx
  on public.analytics_recommends(store_id, created_at desc);
