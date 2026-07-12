const env = require('../config/env');

const getStatus = (req, res) => {
  res.json({
    status: 'ok',
    service: 'Buy by Size API',
    environment: env.nodeEnv
  });
};

module.exports = { getStatus };
