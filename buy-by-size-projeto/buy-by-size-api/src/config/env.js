require('dotenv').config();

const REQUIRED_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}. Configure o .env (veja .env.example).`
  );
}

if (!process.env.ADMIN_API_KEY) {
  console.warn(
    'ADMIN_API_KEY não definida — o acesso admin via header x-api-key ficará desabilitado.'
  );
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  adminApiKey: process.env.ADMIN_API_KEY || null
};
