// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios'); // Novo para baixar o XML
const xml2js = require('xml2js'); // Novo para fazer o parsing do XML
const app = express();
const PORT = process.env.PORT || 3000;
// const swaggerUi = require('swagger-ui-express');
// const swaggerJsdoc = require('swagger-jsdoc');

// --- Configuração do Swagger ---
// const swaggerOptions = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'Buy by Size API',
//       version: '1.0.0',
//       description: 'API para gerenciamento de regras de medidas e sugestão de tamanhos.',
//     },
//     servers: [
//       {
//         url: `http://localhost:${process.env.PORT || 3000}`,
//         description: 'Servidor Local',
//       },
//     ],
//     components: {
//       securitySchemes: {
//         ApiKeyAuth: {
//           type: 'apiKey',
//           in: 'header',
//           name: 'X-API-Key', // O nome do header que configuramos
//         },
//       },
//     },
//     security: [
//       {
//         ApiKeyAuth: [],
//       },
//     ],
//   },
//   // Arquivos onde o Swagger vai procurar os comentários de documentação
//   apis: ['./server.js'], 
// };

// const swaggerDocs = swaggerJsdoc(swaggerOptions);
// // Rota para acessar a documentação
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware de autenticação de administrador (usa chave simples)
const authenticateAdmin = (req, res, next) => {
  const apiKey = req.headers['x-api-key']; // Espera-se a chave no header X-API-Key

  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Acesso Proibido. Chave de API inválida.' });
  }

  next(); // Continua para a próxima função (a lógica da rota)
};

// Define as origens permitidas (Substitua por domínios reais de produção)
const allowedOrigins = [
  'http://localhost:3000', // Para o seu frontend de desenvolvimento
  'https://www.loja-do-cliente.com', // DOMÍNIO DO E-COMMERCE
  'https://admin.loja-do-cliente.com' // DOMÍNIO DO PAINEL ADMIN
  // Adicione aqui todos os domínios que acessarão esta API
];

const corsOptions = {
  // A função verifica se a origem da requisição está na lista allowedOrigins
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (ex: Postman, scripts de servidor)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Bloqueia se a origem não for permitida
      callback(new Error('Not allowed by CORS'), false);
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


// ROTA DE SINCRONIZAÇÃO DE CATÁLOGO VIA XML URL
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
    const itemsPath = result.rss?.channel?.item || result.feed?.entry || [];

    // 2. Preparar dados
    const produtosParaSincronizar = itemsPath.map(item => ({
      produto_id: item['g:id'] || item.link || null,
      nome_regra: item['g:title'] || 'Produto sem nome',
      campos_necessarios: {},
    })).filter(p => p.produto_id !== null);

    // 3. Inserir Produtos (Upsert)
    const { error: dbError, data: dbData } = await supabase
      .from('produtos_tamanhos')
      .upsert(produtosParaSincronizar, { onConflict: 'produto_id' })
      .select();

    if (dbError) throw dbError;

    // --- NOVO: GRAVAR LOG DE SUCESSO ---
    // Aqui escrevemos no "Diário de Bordo" que tudo deu certo
    await supabase.from('sync_logs').insert([{
      status: 'success',
      details: `${dbData.length} produtos processados com sucesso.`
    }]);

    res.json({
      success: true,
      synced_count: dbData.length,
      message: `${dbData.length} produtos sincronizados.`,
    });

  } catch (error) {
    console.error('Erro no processamento do XML:', error.message);

    // --- NOVO: GRAVAR LOG DE ERRO ---
    // Se algo falhar, também escrevemos no "Diário" explicando o porquê
    await supabase.from('sync_logs').insert([{
      status: 'error',
      details: `Falha: ${error.message || 'Erro desconhecido'}`
    }]);

    res.status(500).json({ error: 'Erro ao processar XML.', details: error.message });
  }
});

// 4. ROTA POST: CRIAR UMA NOVA REGRA (Agora vinculada a modelagem_id)
app.post('/api/regras', authenticateAdmin, async (req, res) => {
  // O corpo agora recebe 'modelagem_id' em vez de 'produto_id'
  const { modelagem_id, condicoes, sugestao_tamanho, prioridade } = req.body;

  if (!modelagem_id || !condicoes || !sugestao_tamanho) {
    return res.status(400).json({ error: 'Dados incompletos (modelagem_id, condicoes, sugestao).' });
  }

  try {
    // Inserir diretamente vinculando à modelagem
    const { error: insertError, data: insertData } = await supabase
      .from('regras_detalhes')
      .insert([
        {
          modelagem_id: modelagem_id, // Vincula à Modelagem
          condicoes: condicoes,
          sugestao_tamanho: sugestao_tamanho,
          prioridade: prioridade || 10
        },
      ])
      .select();

    if (insertError) {
      console.error('Erro ao inserir regra:', insertError);
      return res.status(500).json({ error: 'Falha ao salvar a regra no banco.' });
    }

    res.status(201).json({
      success: true,
      message: 'Regra criada na modelagem com sucesso!',
      regra: insertData[0]
    });

  } catch (error) {
    console.error('Erro na criação da regra:', error.message);
    res.status(500).json({ error: 'Erro interno ao criar regra.' });
  }
});

// 5. ROTA GET: BUSCAR TODAS AS REGRAS (Por modelagem_id)
app.get('/api/regras', authenticateAdmin, async (req, res) => {
  const { modelagem_id } = req.query; // Captura o ID da modelagem

  if (!modelagem_id) {
    return res.status(400).json({ error: 'O modelagem_id é obrigatório.' });
  }

  try {
    const { data: regras, error: fetchError } = await supabase
      .from('regras_detalhes')
      .select('*')
      .eq('modelagem_id', modelagem_id) // Filtra pela modelagem
      .order('prioridade', { ascending: false });

    if (fetchError) {
      console.error('Erro ao buscar regras:', fetchError);
      return res.status(500).json({ error: 'Falha ao buscar as regras.' });
    }

    res.status(200).json({ regras: regras });

  } catch (error) {
    console.error('Erro geral na busca de regras:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
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

// 8. ROTA POST: CÁLCULO DA SUGESTÃO DE TAMANHO
app.post('/api/sugestao', async (req, res) => {
  const { produto_id, medidas } = req.body; // produto_id aqui é o SKU (ex: SKU-1001)

  if (!produto_id || !medidas) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  try {
    // 1. Buscar o Produto para descobrir qual é a MODELAGEM dele
    const { data: produto, error: prodError } = await supabase
      .from('produtos_tamanhos')
      .select('modelagem_id') // <--- Agora buscamos a modelagem!
      .eq('produto_id', produto_id)
      .single();

    if (prodError || !produto) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    if (!produto.modelagem_id) {
      return res.status(200).json({
        sugestao: null,
        message: 'Este produto ainda não possui uma tabela de medidas vinculada.'
      });
    }

    // 2. Buscar regras vinculadas àquela MODELAGEM (não mais ao produto direto)
    // Note que na tabela regras_detalhes, agora filtramos por 'modelagem_id'
    // (Você precisará garantir que suas regras no banco tenham essa coluna preenchida)
    const { data: regras, error: regrasError } = await supabase
      .from('regras_detalhes')
      .select('*')
      .eq('modelagem_id', produto.modelagem_id) // <--- Mudança aqui
      .order('prioridade', { ascending: false });

    if (regrasError || !regras || regras.length === 0) {
      return res.status(200).json({ sugestao: null, message: 'Sem regras configuradas para esta modelagem.' });
    }

    // 3. Lógica de Avaliação (Mantém a mesma função evaluateCondition que já existe)
    let sugestaoEncontrada = null;
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

    if (sugestaoEncontrada) {
      res.json({ sugestao: sugestaoEncontrada, message: 'Sucesso.' });
    } else {
      res.json({ sugestao: null, message: 'Nenhuma regra atendeu às medidas.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// Ex: GET /api/produtos
// 9. ROTA GET: LISTAR PRODUTOS (Com Paginação, Busca E FILTRO POR MODELAGEM)
app.get('/api/produtos', authenticateAdmin, async (req, res) => {
  const { page = 1, limit = 50, q = '', modelagem_id } = req.query;

  try {
    let query = supabase
      .from('produtos_tamanhos')
      .select('produto_id, nome_regra, status, id, modelagem_id', { count: 'exact' });

    // 1. Filtro de Busca (Texto)
    if (q) {
      query = query.or(`nome_regra.ilike.%${q}%,produto_id.ilike.%${q}%`);
    }

    // 2. NOVO: Filtro por Modelagem
    if (modelagem_id) {
      // Se estamos pedindo produtos de uma modelagem específica, filtramos por ela
      query = query.eq('modelagem_id', modelagem_id);

      // TRUQUE: Se filtrar por modelagem, queremos ver TODOS vinculados, 
      // então não aplicamos o range de paginação pequena (limit 50), 
      // ou aumentamos o limite para garantir que a lista venha completa na aba.
      // Vamos assumir um limite alto para essa view (ex: 1000).
      const safeLimit = 1000;
      const from = (page - 1) * safeLimit;
      const to = from + safeLimit - 1;
      query = query.range(from, to);
    } else {
      // Comportamento padrão (Catálogo geral paginado)
      const from = (page - 1) * limit;
      const to = from + parseInt(limit) - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query.order('nome_regra', { ascending: true });

    if (error) throw error;

    res.json({
      produtos: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / (modelagem_id ? 1000 : limit))
    });

  } catch (error) {
    console.error('Erro listar produtos:', error.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// 10. ROTAS DE CONFIGURAÇÃO DA LOJA

// GET /api/store-config
app.get('/api/store-config', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('store_config')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    // Se não existir, retorna 404 para o front tratar ou objeto padrão
    if (!data) return res.status(404).json({ error: 'Configuração não encontrada' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// POST /api/store-config (Salvar/Atualizar)
app.post('/api/store-config', authenticateAdmin, async (req, res) => {
  const settings = req.body;
  try {
    // Tenta buscar se existe para pegar o ID
    const { data: existing } = await supabase.from('store_config').select('id').single();

    let result;
    if (existing) {
      result = await supabase.from('store_config').update(settings).eq('id', existing.id);
    } else {
      result = await supabase.from('store_config').insert([settings]);
    }

    if (result.error) throw result.error;
    res.json({ success: true, message: 'Configuração salva' });
  } catch (error) {
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
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ logs: data });
  } catch (error) {
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

// 13. LISTAR MODELAGENS
app.get('/api/modelagens', authenticateAdmin, async (req, res) => {
  try {
    // Busca modelagens e conta produtos_tamanhos vinculados
    // O Supabase tem uma sintaxe específica para counts em relações, mas para simplificar
    // e garantir compatibilidade, faremos duas queries rápidas ou uma view.
    // Vamos usar a abordagem simples: buscar modelagens e depois contar.

    // 1. Busca Modelagens
    const { data: modelagens, error } = await supabase
      .from('modelagens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 2. Busca contagem de produtos agrupados por modelagem
    // SELECT modelagem_id, count(*) FROM produtos_tamanhos GROUP BY modelagem_id
    // Infelizmente o cliente JS do Supabase não faz GROUP BY simples facilmente sem RPC.
    // Vamos fazer uma query que busca apenas os modelagem_id dos produtos para contar no JS do server.
    // (Para escalas gigantes isso muda, mas para < 10k produtos é ultra rápido)

    const { data: produtos } = await supabase
      .from('produtos_tamanhos')
      .select('modelagem_id');

    // Conta: { 'uuid-modelagem-1': 5, 'uuid-modelagem-2': 10 }
    const counts = {};
    if (produtos) {
      produtos.forEach(p => {
        if (p.modelagem_id) {
          counts[p.modelagem_id] = (counts[p.modelagem_id] || 0) + 1;
        }
      });
    }

    // Mescla a contagem no objeto da modelagem
    const result = modelagens.map(m => ({
      ...m,
      total_produtos: counts[m.id] || 0
    }));

    res.json(result);

  } catch (err) {
    console.error('Erro listar modelagens:', err);
    res.status(500).json({ error: 'Erro ao listar modelagens.' });
  }
});

// 14. CRIAR NOVA MODELAGEM
app.post('/api/modelagens', authenticateAdmin, async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

  try {
    const { data, error } = await supabase
      .from('modelagens')
      .insert([{ nome }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Erro criar modelagem:', err);
    res.status(500).json({ error: 'Erro ao criar modelagem.' });
  }
});

// 15. VINCULAR PRODUTO A UMA MODELAGEM
app.put('/api/produtos/:id/vincular', authenticateAdmin, async (req, res) => {
  const { id } = req.params; // ID do Produto (UUID interno)
  const { modelagem_id } = req.body; // ID da Modelagem

  try {
    const { error } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id: modelagem_id })
      .eq('id', id);

    if (error) throw error;
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
  // product_ids deve ser um Array: ['uuid-1', 'uuid-2']

  if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({ error: 'Lista de produtos inválida.' });
  }

  try {
    // Atualiza todos os produtos cujo ID esteja na lista
    const { error } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id: modelagem_id })
      .in('id', product_ids); // .in() é o segredo para fazer em lote

    if (error) throw error;

    res.json({
      success: true,
      message: `${product_ids.length} produtos vinculados com sucesso.`
    });

  } catch (err) {
    console.error('Erro vínculo em massa:', err);
    res.status(500).json({ error: 'Erro ao vincular produtos.' });
  }
});

// 18. ROTA POST: DESVINCULAR PRODUTOS (EM MASSA)
app.post('/api/produtos/desvincular-mass', authenticateAdmin, async (req, res) => {
  const { product_ids } = req.body;

  if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({ error: 'Lista de produtos inválida.' });
  }

  try {
    // Define modelagem_id como NULL para os produtos selecionados
    const { error } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id: null })
      .in('id', product_ids);

    if (error) throw error;

    res.json({ success: true, message: 'Produtos desvinculados com sucesso.' });

  } catch (err) {
    console.error('Erro desvincular:', err);
    res.status(500).json({ error: 'Erro ao desvincular produtos.' });
  }
});

// 19. ROTA GET: DASHBOARD STATS (KPIs Reais e Lista de Atenção)
app.get('/api/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    // 1. Contagem Total de Produtos
    const { count: total, error: errTotal } = await supabase
      .from('produtos_tamanhos')
      .select('*', { count: 'exact', head: true }); // 'head: true' só conta, não baixa dados!

    if (errTotal) throw errTotal;

    // 2. Contagem de Configurados (onde modelagem_id não é nulo)
    const { count: configured, error: errConfig } = await supabase
      .from('produtos_tamanhos')
      .select('*', { count: 'exact', head: true })
      .not('modelagem_id', 'is', null);

    if (errConfig) throw errConfig;

    // 3. Buscar os 5 primeiros produtos "sem modelagem" para a lista de atenção
    const { data: attentionList, error: errAtt } = await supabase
      .from('produtos_tamanhos')
      .select('id, produto_id, nome_regra')
      .is('modelagem_id', null)
      .limit(5);

    if (errAtt) throw errAtt;

    // Retorna tudo mastigado para o front
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
  try {
    const { data } = await supabase
      .from('produtos_tamanhos')
      .select('modelagem_id')
      .eq('produto_id', produtoId)
      .single();

    // Retorna true se tiver modelagem, false se não
    res.json({ available: !!data?.modelagem_id });
  } catch (err) {
    res.json({ available: false });
  }
});

app.listen(PORT, () => {
  // Esta mensagem deve aparecer no terminal
  console.log(`🚀 API rodando em http://localhost:${PORT}/api/status`);
});