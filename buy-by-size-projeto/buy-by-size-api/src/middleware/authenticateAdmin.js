const supabase = require('../lib/supabaseClient');
const env = require('../config/env');
const AppError = require('../errors/AppError');
const asyncHandler = require('../utils/asyncHandler');

const MASTER_STORE_ID = '00000000-0000-0000-0000-000000000000';

const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (env.adminApiKey && apiKey === env.adminApiKey) {
    req.storeId = MASTER_STORE_ID;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) throw new AppError(401, 'Token ausente');

  const token = authHeader.split(' ')[1];

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user) throw new AppError(401, 'Token inválido');

  const { data: storeLink } = await supabase
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single();

  if (!storeLink) throw new AppError(403, 'Usuário sem loja vinculada.');

  req.storeId = storeLink.store_id;
  next();
});

module.exports = authenticateAdmin;
