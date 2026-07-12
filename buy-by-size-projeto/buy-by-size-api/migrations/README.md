# Migrations

Schema completo do banco usado pela Buy by Size API, reconstruído a partir das
queries feitas pelo código (não existia nenhuma migration versionada antes).

## Requisitos

- Um projeto Supabase (schema `auth` gerenciado pelo Supabase é necessário —
  `003_store_users.sql` referencia `auth.users`, então isso **não** roda num
  Postgres genérico sem esse schema).
- `DATABASE_URL` apontando para a connection string direta do Postgres do
  projeto (Supabase Dashboard → Project Settings → Database → Connection
  string → URI). Use a conexão direta (porta 5432) ou o pooler em modo
  "session", não o pooler em modo "transaction" (porta 6543), pois as
  migrations rodam em transação.

## Como rodar

```bash
cp .env.example .env
# preencha SUPABASE_URL, SUPABASE_SERVICE_KEY e DATABASE_URL no .env

npm install
npm run migrate
```

O runner (`scripts/migrate.js`) aplica os arquivos `.sql` desta pasta em ordem
numérica, uma única vez cada, registrando o progresso na tabela
`public.schema_migrations`. É seguro rodar `npm run migrate` várias vezes —
migrations já aplicadas são ignoradas.

## Adicionando uma nova migration

Crie um novo arquivo `NNN_descricao.sql` com o próximo número (ex.:
`012_nova_coluna.sql`). Nunca edite um arquivo já aplicado em produção — crie
uma nova migration para alterá-lo.
