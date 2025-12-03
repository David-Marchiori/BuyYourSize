// server.js

// 1. Carrega as variáveis de ambiente
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// --- 2. Configuração do Multer (Onde salvar o arquivo temporariamente) ---
const upload = multer({ dest: 'tmp/csv/' });

// --- 3. NOVA ROTA: Upload de CSV ---
// Vamos criar uma rota POST para receber o arquivo.
app.post('/api/produtos/upload-csv', upload.single('produtos'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo CSV foi enviado.' });
  }

  const filePath = req.file.path;
  const produtosParaInserir = [];
  let errorCount = 0;

  try {
    // 3a. Processar o CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Assume que o CSV tem colunas 'produto_id' e 'nome_regra'
        if (data.produto_id && data.nome_produto) {
          produtosParaInserir.push({
            produto_id: data.produto_id,
            nome_regra: data.nome_produto,
            campos_necessarios: {}, // Deixamos vazio por enquanto, o admin define depois
            status: 'ativo'
          });
        }
      })
      .on('end', async () => {
        // 3b. Inserir dados no Supabase
        if (produtosParaInserir.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Nenhuma linha válida encontrada no CSV.' });
        }
        
        const { error: dbError, data: dbData } = await supabase
          .from('produtos_tamanhos')
          .insert(produtosParaInserir)
          .select();

        // 3c. Finalização
        // Deleta o arquivo temporário após o processamento
        fs.unlinkSync(filePath); 

        if (dbError) {
          console.error("Erro na inserção do Supabase:", dbError);
          // O erro de unique constraint (produto_id duplicado) é comum aqui
          return res.status(500).json({ 
            error: 'Erro ao inserir no banco de dados. Verifique por IDs duplicados.', 
            details: dbError.message 
          });
        }

        res.json({ 
          success: true, 
          imported_count: dbData.length,
          message: `${dbData.length} produtos importados com sucesso.`,
          error_lines: errorCount
        });
      });
  } catch (err) {
    fs.unlinkSync(filePath); // Tenta deletar se houver erro
    res.status(500).json({ error: 'Falha no processamento do arquivo.' });
  }
});
// FIM da NOVA ROTA

// 2. Cria a instância do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY 
);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para que o frontend possa se comunicar com o backend
app.use(cors()); 

// Middleware para analisar o corpo das requisições JSON
app.use(express.json()); 

// 3. Rota de Status (Teste Inicial)
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'Buy by Size API', environment: process.env.NODE_ENV || 'development' });
});

// 7. Inicia o Servidor
app.listen(PORT, () => {
  // Esta mensagem deve aparecer no terminal
  console.log(`🚀 API rodando em http://localhost:${PORT}/api/status`);
});