require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      'DATABASE_URL não definida. Configure a connection string do Postgres do Supabase no .env (veja migrations/README.md).'
    );
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const { rows: appliedRows } = await client.query(
      'select filename from public.schema_migrations'
    );
    const applied = new Set(appliedRows.map((row) => row.filename));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const pending = files.filter((file) => !applied.has(file));

    if (pending.length === 0) {
      console.log('Nenhuma migration pendente. Banco já está atualizado.');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`Aplicando ${file}...`);

      try {
        await client.query('begin');
        await client.query(sql);
        await client.query(
          'insert into public.schema_migrations (filename) values ($1)',
          [file]
        );
        await client.query('commit');
        console.log(`OK: ${file}`);
      } catch (err) {
        await client.query('rollback');
        throw new Error(`Falha ao aplicar ${file}: ${err.message}`);
      }
    }

    console.log(`${pending.length} migration(s) aplicada(s) com sucesso.`);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
