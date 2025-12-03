// src/supabase.js

import { createClient } from '@supabase/supabase-js'

// --- ATENÇÃO: SUBSTITUA COM SEUS DADOS ---
// É altamente recomendado que estas chaves fiquem em um arquivo .env 
// para segurança e portabilidade (ex: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
const supabaseUrl = 'https://jqrljvkemgedeshdghct.supabase.co' // Ex: 'https://xyz123.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcmxqdmtlbWdlZGVzaGRnaGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTUwMzAsImV4cCI6MjA4MDI3MTAzMH0.oxKa7GFU9EMoWMJBBp6BvqAI3eHwxxiHrxdtGb28voA'

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)