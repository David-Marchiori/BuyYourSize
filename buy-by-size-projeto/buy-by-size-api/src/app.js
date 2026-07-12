const path = require('path');
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { strictCorsOptions } = require('./config/cors');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(env.nodeEnv === 'production' ? cors(strictCorsOptions) : cors());

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
