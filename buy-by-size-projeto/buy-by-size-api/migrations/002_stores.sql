create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Loja sem nome',
  created_at timestamptz not null default now()
);

comment on table public.stores is 'Lojas (tenants) que utilizam a Buy by Size API.';

-- Loja mestre usada pelo fluxo de autenticação via ADMIN_API_KEY
-- (ver src/middleware/authenticateAdmin.js -> MASTER_STORE_ID).
insert into public.stores (id, name)
values ('00000000-0000-0000-0000-000000000000', 'Loja Mestre (Admin API Key)')
on conflict (id) do nothing;
