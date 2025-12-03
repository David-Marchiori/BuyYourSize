// server.js

// 1. Carrega as variáveis de ambiente
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

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

