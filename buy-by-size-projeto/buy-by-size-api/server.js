// server.js

// 1. Carrega as variáveis de ambiente
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios'); // Novo para baixar o XML
const xml2js = require('xml2js'); // Novo para fazer o parsing do XML
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Cria a instância do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware para que o frontend possa se comunicar com o backend
app.use(cors()); 

// Middleware para analisar o corpo das requisições JSON
app.use(express.json()); 

// 3. Rota de Status (Teste Inicial)
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'Buy by Size API', environment: process.env.NODE_ENV || 'development' });
});

// ROTA DE TESTE DE ESCRITA SIMPLES
app.get('/api/teste-escrita', async (req, res) => {
  const produtoDeTeste = {
    produto_id: 'TESTE-CHAVE-' + Date.now(), // ID único
    nome_regra: 'Produto Teste Manual',
    campos_necessarios: { altura: 'sim' },
    status: 'inativo'
  };

  try {
    const { error } = await supabase
      .from('produtos_tamanhos')
      .insert([produtoDeTeste]);

    if (error) {
      console.error("ERRO de Escrita Supabase:", error);
      // Se der 401, o erro será exibido aqui
      return res.status(500).json({ success: false, message: 'Falha na escrita no Supabase. VERIFIQUE A CHAVE DE SERVIÇO!', details: error.message });
    }

    res.json({ success: true, message: 'Inserção de Teste BEM-SUCEDIDA! A chave está correta.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro interno do servidor.', details: err.message });
  }
});

// ROTA DE SINCRONIZAÇÃO DE CATÁLOGO VIA XML URL
app.post('/api/produtos/sync-xml', async (req, res) => {
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

// 7. Inicia o Servidor
app.listen(PORT, () => {
  // Esta mensagem deve aparecer no terminal
  console.log(`🚀 API rodando em http://localhost:${PORT}/api/status`);
});