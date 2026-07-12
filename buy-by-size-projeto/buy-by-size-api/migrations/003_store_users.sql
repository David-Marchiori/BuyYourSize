-- Vincula usuários do Supabase Auth (auth.users, gerenciado pelo Supabase)
-- à loja que eles administram no painel.
create table if not exists public.store_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists store_users_store_id_idx on public.store_users(store_id);

comment on table public.store_users is 'Vincula usuários do Supabase Auth à loja que administram (1 usuário -> 1 loja).';
