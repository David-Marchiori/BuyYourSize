-- Expande modelagens.tipo de 2 (roupa/calcado) para 4 categorias de produto.
-- Sem dados reais usando 'roupa' no momento desta migration (confirmado antes de aplicar).
alter table public.modelagens drop constraint if exists modelagens_tipo_check;
alter table public.modelagens add constraint modelagens_tipo_check
  check (tipo in ('parte_cima', 'parte_baixo', 'vestido', 'calcado'));
alter table public.modelagens alter column tipo drop default;
