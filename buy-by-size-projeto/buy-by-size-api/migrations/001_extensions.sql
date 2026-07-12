-- Extensões necessárias:
-- pgcrypto -> gen_random_uuid() para chaves primárias
-- pg_trgm  -> índices GIN para acelerar buscas com ILIKE '%...%' (usadas em /produtos)
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
