const path = require('path');
const express = require('express');
const cors = require('cors');
const { baseCorsOptions, strictCorsOptions } = require('./config/cors');

const statusRoutes = require('./routes/status');
const productRoutes = require('./routes/products');
const ruleRoutes = require('./routes/rules');
const widgetRoutes = require('./routes/widget');
const modelingRoutes = require('./routes/modelings');
const storeConfigRoutes = require('./routes/storeConfig');
const syncLogRoutes = require('./routes/syncLogs');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.use(cors(strictCorsOptions));
} else {
  app.use(cors());
}

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.use('/api', statusRoutes);
app.use('/api', productRoutes);
app.use('/api', ruleRoutes);
app.use('/api', widgetRoutes);
app.use('/api', modelingRoutes);
app.use('/api', storeConfigRoutes);
app.use('/api', syncLogRoutes);
app.use('/api', dashboardRoutes);

module.exports = app;
