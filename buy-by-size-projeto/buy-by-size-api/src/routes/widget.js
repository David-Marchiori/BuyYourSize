const express = require('express');
const supabase = require('../lib/supabase');
const {
  evaluateCondition,
  parsePhraseList
} = require('../utils/rules');

const router = express.Router();

router.post('/sugestao', async (req, res) => {
  const { produto_id, medidas, store_id } = req.body;

  if (!produto_id || !medidas || !store_id) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  try {
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

    const { data: regras } = await supabase
      .from('regras_detalhes')
      .select('*')
      .eq('modelagem_id', produto.modelagem_id)
      .order('prioridade', { ascending: false });

    if (!regras || !regras.length) {
      return res.status(200).json({ sugestao: null, message: 'Tabela vazia.' });
    }

    let sugestaoEncontrada = null;

    if (tipoTabela === 'calcado') {
      const peCliente = parseFloat(medidas.pe);
      if (!peCliente) {
        return res.json({ sugestao: null, message: 'Medida do pé inválida.' });
      }

      for (const regra of regras) {
        if (peCliente >= parseFloat(regra.pe_min) && peCliente <= parseFloat(regra.pe_max)) {
          sugestaoEncontrada = {
            tamanho: regra.sugestao_tamanho,
            phrases: parsePhraseList(regra.frase_sugestao)
          };
          break;
        }
      }
    } else {
      for (const regra of regras) {
        let todasVerdadeiras = true;
        for (const condicao of regra.condicoes) {
          const medidaCliente = medidas[condicao.campo];
          if (medidaCliente === undefined || medidaCliente === null) {
            todasVerdadeiras = false;
            break;
          }
          if (!evaluateCondition(parseFloat(medidaCliente), condicao.operador, parseFloat(condicao.valor))) {
            todasVerdadeiras = false;
            break;
          }
        }
        if (todasVerdadeiras) {
          sugestaoEncontrada = {
            tamanho: regra.sugestao_tamanho,
            phrases: parsePhraseList(regra.frase_sugestao)
          };
          break;
        }
      }
    }

    if (sugestaoEncontrada) {
      const phrases = sugestaoEncontrada.phrases || [];
      res.json({
        sugestao: sugestaoEncontrada.tamanho,
        frase: phrases[0] || null,
        frases: phrases,
        tipo: tipoTabela
      });
    } else {
      res.status(200).json({ sugestao: null, message: 'Nenhuma regra encontrada.' });
    }
  } catch (error) {
    console.error('Erro API:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/widget/check/:produtoId', async (req, res) => {
  const { produtoId } = req.params;
  const { storeId } = req.query;

  if (!storeId) {
    console.warn('Widget check sem storeId');
    return res.json({ available: false });
  }

  try {
    const { data: produto, error } = await supabase
      .from('produtos_tamanhos')
      .select('modelagem_id, modelagens(tipo)')
      .eq('produto_id', produtoId)
      .eq('store_id', storeId)
      .single();

    if (error || !produto || !produto.modelagem_id) {
      return res.json({ available: false });
    }

    return res.json({
      available: true,
      type: produto.modelagens?.tipo || 'roupa'
    });
  } catch (err) {
    console.error(err);
    return res.json({ available: false });
  }
});

module.exports = router;
