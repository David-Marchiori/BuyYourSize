const supabase = require('../lib/supabase');

const MASTER_STORE_ID = '00000000-0000-0000-0000-000000000000';

const authenticateAdmin = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
    req.storeId = MASTER_STORE_ID;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });

    const { data: storeLink } = await supabase
      .from('store_users')
      .select('store_id')
      .eq('user_id', user.id)
      .single();

    if (!storeLink) {
      return res.status(403).json({ error: 'Usuário sem loja vinculada.' });
    }

    req.storeId = storeLink.store_id;
    next();
  } catch (err) {
    console.error('Erro Auth:', err);
    res.status(500).json({ error: 'Erro na autenticação' });
  }
};

module.exports = authenticateAdmin;
