const express = require("express");
const supabase = require("../lib/supabase");
const authenticateAdmin = require("../middleware/authenticateAdmin");

const router = express.Router();

router.get("/dashboard/stats", authenticateAdmin, async (req, res) => {
  try {
    const { count: total, error: errTotal } = await supabase
      .from("produtos_tamanhos")
      .select("*", { count: "exact", head: true })
      .eq("store_id", req.storeId);

    if (errTotal) throw errTotal;

    const { count: configured, error: errConfig } = await supabase
      .from("produtos_tamanhos")
      .select("*", { count: "exact", head: true })
      .eq("store_id", req.storeId)
      .not("modelagem_id", "is", null);

    if (errConfig) throw errConfig;

    const { data: attentionList, error: errAtt } = await supabase
      .from("produtos_tamanhos")
      .select("id, produto_id, nome_regra")
      .eq("store_id", req.storeId)
      .is("modelagem_id", null)
      .limit(5);

    if (errAtt) throw errAtt;

    res.json({
      kpis: {
        total: total || 0,
        configured: configured || 0,
        missing: (total || 0) - (configured || 0),
      },
      attention: attentionList || [],
    });
  } catch (err) {
    console.error("Erro dashboard stats:", err);
    res.status(500).json({ error: "Erro ao calcular estat¡sticas." });
  }
});

// Rota para pegar os contadores do Dashboard
router.get("/dashboard/kpis", authenticateAdmin, async (req, res) => {
  try {
    const storeId = req.storeId; // Vem do middleware de autenticação

    // 1. Total Geral
    const { count: total, error: errTotal } = await supabase
      .from("analytics_recommends")
      .select("*", { count: "exact", head: true }) // head:true conta sem baixar os dados (muito rápido)
      .eq("store_id", storeId);

    // 2. Total nas últimas 24 horas (Para mostrar o crescimento)
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1); // Subtrai 1 dia

    const { count: last24h, error: err24h } = await supabase
      .from("analytics_recommends")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", ontem.toISOString());

    if (errTotal || err24h) throw new Error("Erro ao buscar KPIs");

    res.json({
      total_recomendacoes: total || 0,
      ultimas_24h: last24h || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao carregar analytics" });
  }
});

module.exports = router;
