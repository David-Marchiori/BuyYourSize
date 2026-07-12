create table if not exists public.regras_detalhes (
  id uuid primary key default gen_random_uuid(),
  modelagem_id uuid not null references public.modelagens(id) on delete cascade,
  regra_mestre_id uuid,
  sugestao_tamanho text not null,
  condicoes jsonb not null default '[]'::jsonb,
  prioridade integer not null default 0,
  pe_min numeric,
  pe_max numeric,
  frase_sugestao text,
  created_at timestamptz not null default now()
);

create index if not exists regras_detalhes_modelagem_id_idx on public.regras_detalhes(modelagem_id);
create index if not exists regras_detalhes_regra_mestre_id_idx on public.regras_detalhes(regra_mestre_id);

comment on column public.regras_detalhes.regra_mestre_id is
  'Campo reservado para agrupar regras derivadas de uma regra mestre (não preenchido pela API atualmente).';
