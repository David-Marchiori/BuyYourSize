const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.storeId);
  res.json(stats);
});

const getKpis = asyncHandler(async (req, res) => {
  const kpis = await dashboardService.getKpis(req.storeId);
  res.json(kpis);
});

module.exports = { getStats, getKpis };
