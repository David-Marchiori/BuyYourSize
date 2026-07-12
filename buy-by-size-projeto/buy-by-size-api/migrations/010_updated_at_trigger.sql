create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.produtos_tamanhos;
create trigger set_updated_at
  before update on public.produtos_tamanhos
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.store_config;
create trigger set_updated_at
  before update on public.store_config
  for each row execute function public.set_updated_at();
