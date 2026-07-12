create table if not exists public.produtos_tamanhos (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  produto_id text not null,
  nome_regra text,
  campos_necessarios jsonb not null default '{}'::jsonb,
  status text not null default 'ativo',
  modelagem_id uuid references public.modelagens(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, produto_id)
);

create index if not exists produtos_tamanhos_store_id_idx on public.produtos_tamanhos(store_id);
create index if not exists produtos_tamanhos_modelagem_id_idx on public.produtos_tamanhos(modelagem_id);
create index if not exists produtos_tamanhos_nome_regra_trgm_idx
  on public.produtos_tamanhos using gin (nome_regra gin_trgm_ops);
create index if not exists produtos_tamanhos_produto_id_trgm_idx
  on public.produtos_tamanhos using gin (produto_id gin_trgm_ops);

comment on column public.produtos_tamanhos.produto_id is
  'ID do produto no feed XML de origem. Único por loja (store_id, produto_id).';
