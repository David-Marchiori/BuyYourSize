// server.js (Início do Arquivo)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js'); // 1. Importação
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Pasta Pública e JSON
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Configuração de CORS (Segurança)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://buy-your-size.vercel.app',
  'https://village23.com.br',
  'https://expert-couscous-vj9xr7wp7q5c4qx-5173.app.github.dev',
  'https://expert-couscous-vj9xr7wp7q5c4qx-5500.app.github.dev',
  'https://bino5.lojavirtualnuvem.com.br'
  // Adicione domínios de clientes aqui no futuro
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 2. INICIALIZAÇÃO DO SUPABASE (CRUCIAL: Antes do middleware)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 3. MIDDLEWARE DE AUTENTICAÇÃO (Agora ele enxerga 'supabase')
const authenticateAdmin = async (req, res, next) => {
  // --- A. Chave Mestra (Seu uso local/Admin Geral) ---
  const apiKey = req.headers['x-api-key'];

  if (apiKey === process.env.ADMIN_API_KEY) {
    req.storeId = '00000000-0000-0000-0000-000000000000'; // Loja Padrão
    return next();
  }

  // --- B. Token de Usuário (Login Real Multi-Tenant) ---
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });

  const token = authHeader.split(' ')[1]; // Remove o "Bearer "

  try {
    // Agora o 'supabase' existe e funciona aqui dentro!
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Token inválido' });

    // Busca qual loja esse usuário pertence
    const { data: storeLink } = await supabase
      .from('store_users')
      .select('store_id')
      .eq('user_id', user.id)
      .single();

    if (!storeLink) {
      return res.status(403).json({ error: 'Usuário não tem loja vinculada.' });
    }

    // Define a loja para o resto das rotas
    req.storeId = storeLink.store_id;
    next();

  } catch (err) {
    console.error('Erro Auth:', err);
    return res.status(500).json({ error: 'Erro na autenticação' });
  }
};

const corsOptions = {
  // A função verifica se a origem da requisição está na lista allowedOrigins
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (ex: Postman, scripts server-side, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // Define os métodos permitidos
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware para que o frontend possa se comunicar com o backend
// Use a configuração CORS restrita em produção, e a aberta em desenvolvimento
if (process.env.NODE_ENV === 'production') {
  app.use(cors(corsOptions));
} else {
  // Permite todas as origens para facilitar o desenvolvimento local/Codespaces
  app.use(cors());
}


// Middleware para analisar o corpo das requisições JSON
app.use(express.json());

// 3. Rota de Status (Teste Inicial)

app.get('/api/status', authenticateAdmin, (req, res) => {
  res.json({ status: 'ok', service: 'Buy by Size API', environment: process.env.NODE_ENV || 'development' });
});


// ROTA DE SINCRONIZAÇÃO DE CATÁLOGO VIA XML URL (Blindada)
app.post('/api/produtos/sync-xml', authenticateAdmin, async (req, res) => {
  const { xmlUrl } = req.body;

  if (!xmlUrl) {
    return res.status(400).json({ error: 'A URL do feed XML é obrigatória.' });
  }

  try {
    // 1. Baixar e Parsear XML
    const xmlResponse = await axios.get(xmlUrl);
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(xmlResponse.data);

    // Adapte o caminho conforme seu XML (ex: result.rss.channel.item ou result.feed.entry)
    // Tenta ser inteligente e achar o array de produtos
    const itemsPath = result.rss?.channel?.item || result.feed?.entry || [];

    // Se for um único item (objeto), transforma em array
    const itemsArray = Array.isArray(itemsPath) ? itemsPath : [itemsPath];

    // 2. Preparar dados com store_id
    const produtosParaSincronizar = itemsArray.map(item => ({
      produto_id: item['g:id'] || item.link || null,
      nome_regra: item['g:title'] || 'Produto sem nome',
      store_id: req.storeId, // <--- TRAVA DE SEGURANÇA
      campos_necessarios: {},
      status: 'ativo' // Garante status ativo ao importar
    })).filter(p => p.produto_id !== null);

    if (produtosParaSincronizar.length === 0) {
      throw new Error('Nenhum produto encontrado no XML.');
    }

    // 3. Inserir Produtos (Upsert)
    // NOTA: Para funcionar 100% multi-tenant, sua tabela no Supabase deve ter uma 
    // Unique Constraint composta por (store_id, produto_id).
    // Caso contrário, se dois clientes tiverem SKU igual, vai dar conflito.
    const { error: dbError, data: dbData } = await supabase
      .from('produtos_tamanhos')
      .upsert(produtosParaSincronizar, { onConflict: 'produto_id' }) // Idealmente seria 'store_id, produto_id'
      .select();

    if (dbError) throw dbError;

    // 4. Gravar Log de Sucesso (Com store_id)
    await supabase.from('sync_logs').insert([{
      store_id: req.storeId, // <--- TRAVA
      status: 'success',
      details: `${dbData ? dbData.length : 0} produtos processados.`
    }]);

    res.json({
      success: true,
      synced_count: dbData ? dbData.length : 0,
      message: `${dbData ? dbData.length : 0} produtos sincronizados.`,
    });

  } catch (error) {
    console.error('Erro no processamento do XML:', error.message);

    // 5. Gravar Log de Erro (Com store_id)
    // Adicionei req.storeId aqui também para o erro aparecer no painel do cliente certo
    await supabase.from('sync_logs').insert([{
      store_id: req.storeId, // <--- TRAVA ADICIONADA AQUI
      status: 'error',
      details: `Falha: ${error.message || 'Erro desconhecido'}`
    }]);

    res.status(500).json({ error: 'Erro ao processar XML.', details: error.message });
  }
});
// 4. CRIAR REGRA (Blindado)
app.post('/api/regras', authenticateAdmin, async (req, res) => {
  const { modelagem_id, condicoes, sugestao_tamanho, prioridade, pe_min, pe_max } = req.body;
  if (!modelagem_id || !sugestao_tamanho) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
  }
  // SEGURANÇA: Verifica se a modelagem pertence à loja do usuário antes de inserir
  const { data: modelagem } = await supabase
    .from('modelagens')
    .select('id')
    .eq('id', modelagem_id)
    .eq('store_id', req.storeId) // <--- TRAVA DE SEGURANÇA
    .single();

  if (!modelagem) return res.status(403).json({ error: 'Modelagem não pertence à sua loja.' });

  try {
    // 2. ADICIONE OS CAMPOS NO INSERT DO SUPABASE
    const { data, error } = await supabase
      .from('regras_detalhes')
      .insert([{
        modelagem_id,
        sugestao_tamanho,
        condicoes: condicoes || [], // Garante array vazio se não vier nada
        prioridade: prioridade || 0,
        pe_min: pe_min || null, // <--- NOVO: Grava o mínimo
        pe_max: pe_max || null  // <--- NOVO: Grava o máximo
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (err) {
    console.error("Erro ao criar regra:", err);
    res.status(500).json({ error: 'Erro ao salvar regra.' });
  }
});

// 5. BUSCAR REGRAS (Blindado)
app.get('/api/regras', authenticateAdmin, async (req, res) => {
  const { modelagem_id } = req.query;
  // SEGURANÇA: Garante que a modelagem consultada é da loja
  const { data: modelagem } = await supabase
    .from('modelagens')
    .select('id')
    .eq('id', modelagem_id)
    .eq('store_id', req.storeId) // <--- TRAVA
    .single();

  if (!modelagem) return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const { data: regras } = await supabase
      .from('regras_detalhes')
      .select('*')
      .eq('modelagem_id', modelagem_id)
      // ADICIONE A ORDENAÇÃO DE SAPATO AQUI TAMBÉM:
      .order('pe_min', { ascending: true, nullsFirst: false })
      .order('prioridade', { ascending: false }); // Note que prioridade geralmente é descrescente (maior ganha)

    res.status(200).json({ regras });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar regras.' });
  }
});

// 6. ROTA PUT: ATUALIZAR REGRA (Mantém igual, pois atualiza pelo ID da regra)
app.put('/api/regras/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { condicoes, sugestao_tamanho, prioridade } = req.body;

  try {
    const updatePayload = {};
    if (condicoes) updatePayload.condicoes = condicoes;
    if (sugestao_tamanho) updatePayload.sugestao_tamanho = sugestao_tamanho;
    if (prioridade !== undefined) updatePayload.prioridade = prioridade;

    const { error: updateError, data: updateData } = await supabase
      .from('regras_detalhes')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Regra atualizada!',
      regra: updateData[0]
    });

  } catch (error) {
    console.error('Erro atualização regra:', error.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// 7. ROTA DELETE (Mantém igual)
app.delete('/api/regras/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('regras_detalhes').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Regra excluída!', deleted_id: id });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir regra.' });
  }
});

// FUNÇÃO AUXILIAR PARA AVALIAR UMA CONDIÇÃO
// Esta função faz a comparação lógica (ex: 1.80 > 1.75)
const evaluateCondition = (medidaCliente, operador, valorRegra) => {
  switch (operador) {
    case '>': return medidaCliente > valorRegra;
    case '>=': return medidaCliente >= valorRegra;
    case '<': return medidaCliente < valorRegra;
    case '<=': return medidaCliente <= valorRegra;
    case '==': return medidaCliente == valorRegra;
    case '!=': return medidaCliente != valorRegra;
    default: return false;
  }
};

// 8. ROTA POST: CÁLCULO DA SUGESTÃO DE TAMANHO (Blindada por store_id)
app.post('/api/sugestao', async (req, res) => {
  const { produto_id, medidas, store_id } = req.body;

  if (!produto_id || !medidas || !store_id) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  try {
    // 1. Identificar o Produto e o Tipo de Tabela
    const { data: produto, error: prodError } = await supabase
      .from('produtos_tamanhos')
      .select('modelagem_id, modelagens(tipo)')
      .eq('produto_id', produto_id)
      .eq('store_id', store_id)
      .single();

    if (prodError || !produto) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    if (!produto.modelagem_id) {
      return res.status(200).json({ sugestao: null, message: 'Sem tabela vinculada.' });
    }

    const tipoTabela = produto.modelagens?.tipo || 'roupa';

    // 2. Buscar as Regras de Tamanho
    const { data: regras, error: regrasError } = await supabase
      .from('regras_detalhes')
      .select('*')
      .eq('modelagem_id', produto.modelagem_id)
      .order('prioridade', { ascending: false }); // Ou order 'pe_min' se for sapato

    if (!regras || regras.length === 0) {
      return res.status(200).json({ sugestao: null, message: 'Tabela vazia.' });
    }

    let sugestaoEncontrada = null;

    // === BIFURCAÇÃO DA LÓGICA ===

    if (tipoTabela === 'calcado') {
      // 👟 LÓGICA DE SAPATO (Simples: Range em CM)
      // Esperamos que o front envie: { pe: 26.5 }
      const peCliente = parseFloat(medidas.pe);

      if (!peCliente) {
        return res.json({ sugestao: null, message: 'Medida do pé inválida.' });
      }

      // Procura onde o pé se encaixa
      for (const regra of regras) {
        // Ex: Se pé (26.5) >= min (26.0) E pé (26.5) <= max (27.0)
        if (peCliente >= parseFloat(regra.pe_min) && peCliente <= parseFloat(regra.pe_max)) {
          sugestaoEncontrada = regra.sugestao_tamanho;
          break; // Achou, para o loop
        }
      }

    } else {
      // 👕 LÓGICA DE ROUPA (A sua lógica complexa atual)
      // Mantenha o seu loop 'for' existente aqui dentro
      for (const regra of regras) {
        let todasVerdadeiras = true;
        for (const condicao of regra.condicoes) {
          const medidaCliente = medidas[condicao.campo];
          if (medidaCliente === undefined || medidaCliente === null) {
            todasVerdadeiras = false; break;
          }
          if (!evaluateCondition(parseFloat(medidaCliente), condicao.operador, parseFloat(condicao.valor))) {
            todasVerdadeiras = false; break;
          }
        }
        if (todasVerdadeiras) {
          sugestaoEncontrada = regra.sugestao_tamanho;
          break;
        }
      }
    }

    // 3. Resposta Final
    if (sugestaoEncontrada) {
      res.json({ sugestao: sugestaoEncontrada, tipo: tipoTabela });
    } else {
      res.json({ sugestao: null, message: 'Nenhum tamanho encontrado para suas medidas.' });
    }

  } catch (error) {
    console.error("Erro API:", error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// 9. LISTAR PRODUTOS (Blindado)
app.get('/api/produtos', authenticateAdmin, async (req, res) => {
  const { page = 1, limit = 50, q = '', modelagem_id } = req.query;

  try {
    let query = supabase
      .from('produtos_tamanhos')
      .select('produto_id, nome_regra, status, id, modelagem_id', { count: 'exact' })
      .eq('store_id', req.storeId); // <--- TRAVA DE SEGURANÇA: Só traz produtos desta loja

    if (q) query = query.or(`nome_regra.ilike.%${q}%,produto_id.ilike.%${q}%`);

    if (modelagem_id) {
      query = query.eq('modelagem_id', modelagem_id);
      // ... lógica de range ...
    } else {
      const from = (page - 1) * limit;
      const to = from + parseInt(limit) - 1;
      query = query.range(from, to);
    }

    const { data, count } = await query.order('nome_regra', { ascending: true });
    res.json({ produtos: data, total: count });

  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
});

// 10. ROTAS DE CONFIGURAÇÃO DA LOJA

// GET /api/store-config
app.get('/api/store-config', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('store_config')
      .select('*')
      .eq('store_id', req.storeId) // <--- TRAVA DE SEGURANÇA
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Se não existir config para esta loja, retorna 404
    if (!data) return res.status(404).json({ error: 'Configuração não encontrada' });

    res.json(data);
  } catch (error) {
    console.error('Erro buscar config:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// POST /api/store-config (Salvar/Atualizar)
app.post('/api/store-config', authenticateAdmin, async (req, res) => {
  const settings = req.body;

  // Garante que estamos salvando com o store_id correto
  // E remove o ID do payload para evitar injeção
  const payload = { ...settings, store_id: req.storeId };
  delete payload.id;

  try {
    // Tenta buscar se existe config para ESTA loja
    const { data: existing } = await supabase
      .from('store_config')
      .select('id')
      .eq('store_id', req.storeId) // <--- TRAVA DE SEGURANÇA
      .single();

    let result;
    if (existing) {
      // Atualiza apenas a config desta loja
      result = await supabase
        .from('store_config')
        .update(payload)
        .eq('id', existing.id)
        .eq('store_id', req.storeId); // Redundância de segurança
    } else {
      // Cria nova config vinculada à loja
      result = await supabase
        .from('store_config')
        .insert([payload]);
    }

    if (result.error) throw result.error;
    res.json({ success: true, message: 'Configuração salva' });
  } catch (error) {
    console.error('Erro salvar config:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// 11. ROTA DE LOGS

// GET /api/sync-logs
app.get('/api/sync-logs', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('store_id', req.storeId) // <--- TRAVA DE SEGURANÇA: Só logs desta loja
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ logs: data });
  } catch (error) {
    console.error('Erro buscar logs:', error);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

// 12. ROTA GET: ESTATÍSTICAS DE REGRAS (Para filtrar "Minhas Regras")
app.get('/api/regras/stats', authenticateAdmin, async (req, res) => {
  try {
    // Busca apenas os IDs das regras cadastradas
    const { data, error } = await supabase
      .from('regras_detalhes')
      .select('regra_mestre_id');

    if (error) {
      console.error('Erro ao buscar stats:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }

    // Processa os dados para contar: { 'UUID_DO_PRODUTO': 3, 'OUTRO_UUID': 1 }
    const stats = {};
    data.forEach(item => {
      const id = item.regra_mestre_id;
      stats[id] = (stats[id] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Erro geral stats:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

app.get('/api/regras/:modelagemId', authenticateAdmin, async (req, res) => {
  const { modelagemId } = req.params;

  try {
    // Busca as regras
    const { data, error } = await supabase
      .from('regras_detalhes')
      .select('*')
      .eq('modelagem_id', modelagemId)
      // Ordenação inteligente: 
      // Se for sapato, queremos ordenar pelo tamanho do pé (pe_min)
      // Se for roupa, pela prioridade (ou ordem de criação)
      // O Supabase permite ordenar múltiplos campos. Nulls ficam por último geralmente.
      .order('pe_min', { ascending: true, nullsFirst: false })
      .order('prioridade', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar regras.' });
  }
});

// 2. ROTA GET: BUSCAR PRODUTOS VINCULADOS A UMA MODELAGEM
// (Essa provavelmente é a que está faltando ou falhando para você)
app.get('/api/modelagens/:id/produtos', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('produtos_tamanhos')
      .select('*') // Pega ID, Nome, Foto, SKU...
      .eq('modelagem_id', id)
      .eq('store_id', req.storeId); // Segurança: Só produtos desta loja

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos vinculados.' });
  }
});

// 13. LISTAR MODELAGENS (Blindado)
app.get('/api/modelagens', authenticateAdmin, async (req, res) => {
  try {
    // Busca apenas modelagens desta loja
    const { data: modelagens } = await supabase
      .from('modelagens')
      .select('*')
      .eq('store_id', req.storeId) // <--- TRAVA
      .order('created_at', { ascending: false });

    // Contagem de produtos (também filtrando pela loja por segurança)
    const { data: produtos } = await supabase
      .from('produtos_tamanhos')
      .select('modelagem_id')
      .eq('store_id', req.storeId); // <--- TRAVA

    // ... lógica de contagem igual ...
    const counts = {};
    if (produtos) {
      produtos.forEach(p => { if (p.modelagem_id) counts[p.modelagem_id] = (counts[p.modelagem_id] || 0) + 1; });
    }
    const result = modelagens.map(m => ({ ...m, total_produtos: counts[m.id] || 0 }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar modelagens.' });
  }
});

// 14. CRIAR MODELAGEM (Agora usando a trava de segurança do middleware)
app.post('/api/modelagens', authenticateAdmin, async (req, res) => {
  // Recebemos apenas o nome e o tipo do frontend
  const { nome, tipo } = req.body;

  try {
    // ⚠️ AQUI ESTÁ A CORREÇÃO:
    // Usamos req.storeId (vindo do middleware) em vez de pedir no corpo da requisição.
    const storeId = req.storeId;

    if (!storeId) {
      return res.status(403).json({ error: 'Loja não identificada.' });
    }

    const { data, error } = await supabase
      .from('modelagens')
      .insert([{
        nome: nome,
        store_id: storeId, // <--- ID Automático e Seguro
        tipo: tipo || 'roupa'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (err) {
    console.error("Erro ao criar modelagem:", err);
    res.status(500).json({ error: 'Erro ao criar modelagem.' });
  }
});

// 15. VINCULAR PRODUTO A UMA MODELAGEM
app.put('/api/produtos/:id/vincular', authenticateAdmin, async (req, res) => {
  const { id } = req.params; // ID do Produto
  const { modelagem_id } = req.body;

  try {
    // 1. Verifica se a Modelagem pertence à loja (Se foi enviada)
    if (modelagem_id) {
      const { data: modCheck } = await supabase
        .from('modelagens')
        .select('id')
        .eq('id', modelagem_id)
        .eq('store_id', req.storeId) // <--- TRAVA
        .single();

      if (!modCheck) return res.status(403).json({ error: 'Modelagem inválida ou de outra loja.' });
    }

    // 2. Atualiza o produto SOMENTE se ele for da loja
    const { error, data } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id: modelagem_id })
      .eq('id', id)
      .eq('store_id', req.storeId) // <--- TRAVA CRÍTICA
      .select();

    if (error) throw error;

    // Se não retornou dados, é porque o produto não existe ou não é desta loja
    if (!data || data.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });

    res.json({ success: true, message: 'Produto vinculado com sucesso.' });
  } catch (err) {
    console.error('Erro vincular:', err);
    res.status(500).json({ error: 'Erro ao vincular produto.' });
  }
});

// 16. ROTA GET: DETALHES DE UMA MODELAGEM
app.get('/api/modelagens/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('modelagens')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar detalhes da modelagem:', err);
    res.status(500).json({ error: 'Erro ao buscar modelagem.' });
  }
});

// 17. ROTA POST: VINCULAR VÁRIOS PRODUTOS A UMA MODELAGEM (EM MASSA)
app.post('/api/produtos/vincular-mass', authenticateAdmin, async (req, res) => {
  const { product_ids, modelagem_id } = req.body;

  if (!product_ids || !Array.isArray(product_ids)) return res.status(400).json({ error: 'Lista inválida.' });

  try {
    // 1. Verifica a Modelagem
    const { data: modCheck } = await supabase
      .from('modelagens')
      .select('id')
      .eq('id', modelagem_id)
      .eq('store_id', req.storeId) // <--- TRAVA
      .single();

    if (!modCheck) return res.status(403).json({ error: 'Acesso negado à modelagem.' });

    // 2. Atualiza apenas os produtos que pertencem à loja
    const { error, count } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id: modelagem_id })
      .in('id', product_ids)
      .eq('store_id', req.storeId); // <--- TRAVA: Ignora IDs de outras lojas se injetados

    if (error) throw error;

    res.json({ success: true, message: 'Produtos vinculados.' });

  } catch (err) {
    console.error('Erro vínculo em massa:', err);
    res.status(500).json({ error: 'Erro ao vincular produtos.' });
  }
});

// 18. ROTA POST: DESVINCULAR PRODUTOS (EM MASSA)
app.post('/api/produtos/desvincular-mass', authenticateAdmin, async (req, res) => {
  const { product_ids } = req.body;

  try {
    // Remove modelagem apenas dos produtos desta loja
    const { error } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id: null })
      .in('id', product_ids)
      .eq('store_id', req.storeId); // <--- TRAVA

    if (error) throw error;

    res.json({ success: true, message: 'Produtos desvinculados.' });

  } catch (err) {
    console.error('Erro desvincular:', err);
    res.status(500).json({ error: 'Erro ao desvincular.' });
  }
});
// 19. ROTA GET: DASHBOARD STATS (KPIs Reais e Lista de Atenção)
app.get('/api/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    // 1. Contagem Total de Produtos (DA LOJA)
    const { count: total, error: errTotal } = await supabase
      .from('produtos_tamanhos')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', req.storeId); // <--- TRAVA ADICIONADA

    if (errTotal) throw errTotal;

    // 2. Contagem de Configurados (DA LOJA)
    const { count: configured, error: errConfig } = await supabase
      .from('produtos_tamanhos')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', req.storeId) // <--- TRAVA ADICIONADA
      .not('modelagem_id', 'is', null);

    if (errConfig) throw errConfig;

    // 3. Lista de Atenção (DA LOJA)
    const { data: attentionList, error: errAtt } = await supabase
      .from('produtos_tamanhos')
      .select('id, produto_id, nome_regra')
      .eq('store_id', req.storeId) // <--- TRAVA ADICIONADA
      .is('modelagem_id', null)
      .limit(5);

    if (errAtt) throw errAtt;

    res.json({
      kpis: {
        total: total || 0,
        configured: configured || 0,
        missing: (total || 0) - (configured || 0)
      },
      attention: attentionList || []
    });

  } catch (err) {
    console.error('Erro dashboard stats:', err);
    res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
  }
});

// 20. ROTA PÚBLICA: CHECAR DISPONIBILIDADE DO WIDGET
app.get('/api/widget/check/:produtoId', async (req, res) => {
  const { produtoId } = req.params;
  const { storeId } = req.query;

  if (!storeId) {
    console.warn('Widget check sem storeId');
    // Se não tiver storeId, é arriscado continuar. Melhor retornar false.
    return res.json({ available: false });
  }

  try {
    const { data: produto, error } = await supabase
      .from('produtos_tamanhos')
      .select('modelagem_id, modelagens(tipo)')
      .eq('produto_id', produtoId)
      .eq('store_id', storeId) // <--- CORREÇÃO: LINHA DESCOMENTADA!
      .single();

    if (error || !produto || !produto.modelagem_id) {
      return res.json({ available: false });
    }

    const tipo = produto.modelagens?.tipo || 'roupa';

    return res.json({
      available: true,
      type: tipo
    });

  } catch (err) {
    console.error(err);
    return res.json({ available: false });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});