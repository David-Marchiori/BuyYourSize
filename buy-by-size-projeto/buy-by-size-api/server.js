// server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios'); // Novo para baixar o XML
const xml2js = require('xml2js'); // Novo para fazer o parsing do XML
const app = express();
const PORT = process.env.PORT || 3000;
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// --- Configuração do Swagger ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Buy by Size API',
      version: '1.0.0',
      description: 'API para gerenciamento de regras de medidas e sugestão de tamanhos.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key', // O nome do header que configuramos
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  // Arquivos onde o Swagger vai procurar os comentários de documentação
  apis: ['./server.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
// Rota para acessar a documentação
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
  const { xmlUrl } = req.body; // Espera-se que o frontend envie a URL no corpo da requisição

  if (!xmlUrl) {
    return res.status(400).json({ error: 'A URL do feed XML é obrigatória.' });
  }

  try {
    // 1. Baixar o conteúdo do XML
    const xmlResponse = await axios.get(xmlUrl);
    const xmlContent = xmlResponse.data;

    // 2. Converter XML para um objeto JavaScript
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(xmlContent);

    // 3. Extrair a lista de produtos (ESTE CAMINHO PODE MUDAR dependendo do feed XML real)
    // Assumimos um formato comum como o do Google Merchant:
    const itemsPath = result.rss?.channel?.item || result.feed?.entry || [];
    
    // 4. Preparar dados para o Supabase
    const produtosParaSincronizar = itemsPath.map(item => ({
      // Mapeamos a ID do Google Merchant (g:id) para a coluna produto_id
      produto_id: item['g:id'] || item.link || null, // <--- CORRIGIDO AQUI!
      
      // Mapeamos o Título do Google Merchant (g:title) para o nome da regra
      nome_regra: item['g:title'] || 'Produto sem nome', // <--- CORRIGIDO AQUI!
      
      campos_necessarios: {}, 
    })).filter(p => p.produto_id !== null); // Remove itens sem ID

    // 5. Inserir/Atualizar no Supabase (usamos 'upsert' para evitar erros de duplicidade no 'produto_id')
    const { error: dbError, data: dbData } = await supabase
      .from('produtos_tamanhos')
      .upsert(produtosParaSincronizar, { onConflict: 'produto_id' }) // Se o produto_id já existir, ele atualiza
      .select();

    if (dbError) {
      console.error('Erro ao sincronizar com o Supabase:', dbError);
      return res.status(500).json({ 
        error: 'Falha na inserção/atualização do banco de dados.', 
        details: dbError.message 
      });
    }

    res.json({
      success: true,
      synced_count: dbData.length,
      message: `${dbData.length} produtos sincronizados ou atualizados com sucesso.`,
    });

  } catch (error) {
    console.error('Erro geral no processamento do XML:', error.message);
    res.status(500).json({ error: 'Erro ao processar o feed XML ou baixar a URL.', details: error.message });
  }
});

// 4. ROTA POST: CRIAR UMA NOVA REGRA DE TAMANHO
app.post('/api/regras', authenticateAdmin, async (req, res) => {
  // O corpo da requisição deve vir do Painel Admin e conter:
  // { produto_id: 'SKU-1001', condicoes: [{}...], sugestao_tamanho: 'P', prioridade: 1 }
  const { produto_id, condicoes, sugestao_tamanho, prioridade } = req.body;

  if (!produto_id || !condicoes || !sugestao_tamanho) {
    return res.status(400).json({ error: 'Dados incompletos para a regra.' });
  }

  try {
    // 1. Encontrar o ID da Regra Mestre (na tabela produtos_tamanhos)
    // Usamos o produto_id (do XML) para encontrar o ID da linha mestra.
    const { data: produtoData, error: findError } = await supabase
      .from('produtos_tamanhos')
      .select('id')
      .eq('produto_id', produto_id)
      .single();

    if (findError || !produtoData) {
      return res.status(404).json({ error: 'Produto não encontrado para criar a regra.' });
    }

    const regra_mestre_id = produtoData.id;

    // 2. Inserir os Detalhes da Regra na tabela regras_detalhes
    const { error: insertError, data: insertData } = await supabase
      .from('regras_detalhes')
      .insert([
        {
          regra_mestre_id: regra_mestre_id,
          condicoes: condicoes,
          sugestao_tamanho: sugestao_tamanho,
          prioridade: prioridade || 0
        },
      ])
      .select();

    if (insertError) {
      console.error('Erro ao inserir regra:', insertError);
      return res.status(500).json({ error: 'Falha ao salvar a regra no banco de dados.' });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Regra de tamanho criada com sucesso!', 
      regra: insertData[0] 
    });

  } catch (error) {
    console.error('Erro na criação da regra:', error.message);
    res.status(500).json({ error: 'Erro interno ao processar a criação da regra.' });
  }
});

// 5. ROTA GET: BUSCAR TODAS AS REGRAS PARA UM PRODUTO
// Ex: GET /api/regras?produto_id=SKU-1001
app.get('/api/regras', authenticateAdmin, async (req, res) => {
  const { produto_id } = req.query; // Captura o produto_id da query string

  if (!produto_id) {
    return res.status(400).json({ error: 'O produto_id é obrigatório para buscar as regras.' });
  }

  try {
    // 1. Encontrar o ID da Regra Mestre (na tabela produtos_tamanhos)
    const { data: produtoData, error: findError } = await supabase
      .from('produtos_tamanhos')
      .select('id')
      .eq('produto_id', produto_id)
      .single();

    if (findError || !produtoData) {
      // Retorna uma lista vazia se o produto não estiver no catálogo, mas evita erro 500.
      if (findError.code === 'PGRST116') { // PGRST116 é o código para "no rows found"
        return res.status(200).json({ regras: [] });
      }
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const regra_mestre_id = produtoData.id;

    // 2. Buscar todos os detalhes da regra (condições) na tabela regras_detalhes
    const { data: regras, error: fetchError } = await supabase
      .from('regras_detalhes')
      .select('*') // Seleciona todas as colunas
      .eq('regra_mestre_id', regra_mestre_id)
      .order('prioridade', { ascending: false }); // Ordena por prioridade

    if (fetchError) {
      console.error('Erro ao buscar regras:', fetchError);
      return res.status(500).json({ error: 'Falha ao buscar as regras no banco de dados.' });
    }

    // 3. Retorna a lista de regras
    res.status(200).json({ regras: regras });

  } catch (error) {
    console.error('Erro geral na busca de regras:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// 6. ROTA PUT: ATUALIZAR UMA REGRA EXISTENTE
// Ex: PUT /api/regras/ID_DA_REGRA (onde ID_DA_REGRA é o 'id' da regras_detalhes)
app.put('/api/regras/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params; // ID da regra (UUID) vindo da URL
  const { condicoes, sugestao_tamanho, prioridade } = req.body;

  try {
    const updatePayload = {};
    if (condicoes) updatePayload.condicoes = condicoes;
    if (sugestao_tamanho) updatePayload.sugestao_tamanho = sugestao_tamanho;
    if (prioridade !== undefined) updatePayload.prioridade = prioridade;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualização fornecido.' });
    }

    const { error: updateError, data: updateData } = await supabase
      .from('regras_detalhes')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (updateError) {
      console.error('Erro ao atualizar regra:', updateError);
      return res.status(500).json({ error: 'Falha ao atualizar a regra.' });
    }
    
    // Confirma se alguma linha foi realmente atualizada
    if (updateData.length === 0) {
        return res.status(404).json({ error: 'Regra não encontrada com o ID fornecido.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Regra atualizada com sucesso!', 
      regra: updateData[0] 
    });

  } catch (error) {
    console.error('Erro na atualização da regra:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// 7. ROTA DELETE: EXCLUIR UMA REGRA
app.delete('/api/regras/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params; // ID da regra (UUID) vindo da URL

  try {
    const { error, count } = await supabase
      .from('regras_detalhes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir regra:', error);
      return res.status(500).json({ error: 'Falha ao excluir a regra do banco de dados.' });
    }
    
    // Verifica se a exclusão realmente ocorreu
    if (count === 0) {
        return res.status(404).json({ error: 'Regra não encontrada com o ID fornecido.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Regra excluída com sucesso!',
      deleted_id: id 
    });

  } catch (error) {
    console.error('Erro na exclusão da regra:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
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
    // Dados esperados: produto_id e as medidas do cliente (ex: altura, peso)
    const { produto_id, medidas } = req.body; 

    if (!produto_id || !medidas) {
        return res.status(400).json({ error: 'Produto ID e medidas do cliente são obrigatórios.' });
    }

    try {
        // 1. Encontrar o ID da Regra Mestre
        const { data: produtoData, error: findError } = await supabase
            .from('produtos_tamanhos')
            .select('id')
            .eq('produto_id', produto_id)
            .single();

        if (findError || !produtoData) {
            return res.status(404).json({ error: 'Produto não encontrado para cálculo de sugestão.' });
        }

        const regra_mestre_id = produtoData.id;

        // 2. Buscar todas as regras de sugestão para este produto
        const { data: regras, error: fetchError } = await supabase
            .from('regras_detalhes')
            .select('*')
            .eq('regra_mestre_id', regra_mestre_id)
            .order('prioridade', { ascending: false }); // Prioriza regras mais importantes

        if (fetchError || regras.length === 0) {
            return res.status(200).json({ 
                sugestao: null, 
                message: 'Nenhuma regra de tamanho cadastrada para este produto.' 
            });
        }

        // 3. Iterar e Avaliar as Regras
        let sugestaoEncontrada = null;

        for (const regra of regras) {
            let todasCondicoesVerdadeiras = true;

            // Itera sobre as condições da regra (ex: [{"campo": "altura", ...}, {"campo": "peso", ...}])
            for (const condicao of regra.condicoes) {
                const medidaCliente = medidas[condicao.campo];
                const valorRegra = condicao.valor;

                // 3a. Verifica se o cliente forneceu a medida que a regra exige
                if (medidaCliente === undefined || medidaCliente === null) {
                    todasCondicoesVerdadeiras = false;
                    break; // Sai do loop de condições, pois falta dado
                }

                // 3b. Executa a comparação (ex: Altura do cliente > 1.75)
                const resultado = evaluateCondition(
                    parseFloat(medidaCliente), 
                    condicao.operador, 
                    parseFloat(valorRegra)
                );

                if (!resultado) {
                    todasCondicoesVerdadeiras = false;
                    break; // Sai do loop de condições, pois uma falhou
                }
            }

            // 3c. Se todas as condições da regra forem verdadeiras, encontramos a sugestão!
            if (todasCondicoesVerdadeiras) {
                sugestaoEncontrada = regra.sugestao_tamanho;
                break; // Encontramos a regra de maior prioridade válida, então paramos
            }
        }
        
        // 4. Retorno Final
        if (sugestaoEncontrada) {
            res.status(200).json({ 
                sugestao: sugestaoEncontrada, 
                message: 'Sugestão calculada com sucesso.' 
            });
        } else {
            res.status(200).json({ 
                sugestao: null, 
                message: 'Nenhuma regra corresponde às medidas fornecidas.' 
            });
        }

    } catch (error) {
        console.error('Erro no cálculo da sugestão:', error.message);
        res.status(500).json({ error: 'Erro interno ao calcular a sugestão.' });
    }
});

// 9. ROTA GET: LISTAR TODOS OS PRODUTOS DO CATÁLOGO (Para o Painel Admin)
// Ex: GET /api/produtos
app.get('/api/produtos', authenticateAdmin, async (req, res) => {
    // Esta rota é administrativa, requer autenticação
    try {
        const { data: produtos, error } = await supabase
            .from('produtos_tamanhos')
            .select('produto_id, nome_regra, status, id') // Campos essenciais
            .order('nome_regra', { ascending: true });
        
        if (error) {
            console.error('Erro ao listar produtos:', error);
            return res.status(500).json({ error: 'Falha ao buscar o catálogo de produtos.' });
        }

        res.status(200).json({ produtos: produtos });
    } catch (error) {
        console.error('Erro na listagem de produtos:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.listen(PORT, () => {
  // Esta mensagem deve aparecer no terminal
  console.log(`🚀 API rodando em http://localhost:${PORT}/api/status`);
});