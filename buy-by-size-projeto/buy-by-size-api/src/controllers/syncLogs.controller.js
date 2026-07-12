const asyncHandler = require('../utils/asyncHandler');
const syncLogsService = require('../services/syncLogs.service');

const listRecentLogs = asyncHandler(async (req, res) => {
  const logs = await syncLogsService.listRecentLogs(req.storeId);
  res.json({ logs });
});

module.exports = { listRecentLogs };
