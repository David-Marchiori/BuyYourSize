create table if not exists public.modelagens (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  nome text not null,
  tipo text not null default 'roupa' check (tipo in ('roupa', 'calcado')),
  created_at timestamptz not null default now()
);

create index if not exists modelagens_store_id_idx on public.modelagens(store_id);

comment on table public.modelagens is 'Tabelas de medida (modelagens) que agrupam regras de sugestão de tamanho.';
