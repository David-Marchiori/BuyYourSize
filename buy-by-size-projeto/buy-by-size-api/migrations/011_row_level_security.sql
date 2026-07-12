-- A API sempre acessa o banco com a service_role key (que ignora RLS por padrão).
-- O admin-panel (frontend) usa a anon key, que é pública no bundle do navegador,
-- apenas para autenticação (Supabase Auth) — ele nunca deve ler/escrever estas
-- tabelas diretamente. Habilitar RLS sem nenhuma policy bloqueia totalmente o
-- acesso via anon/authenticated, fechando esse caminho caso a anon key vaze.
alter table public.stores enable row level security;
alter table public.store_users enable row level security;
alter table public.modelagens enable row level security;
alter table public.produtos_tamanhos enable row level security;
alter table public.regras_detalhes enable row level security;
alter table public.sync_logs enable row level security;
alter table public.store_config enable row level security;
alter table public.analytics_recommends enable row level security;
