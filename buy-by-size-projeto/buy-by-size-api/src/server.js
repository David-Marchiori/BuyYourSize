const env = require('./config/env');
const app = require('./app');

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Buy by Size API rodando na porta ${env.port}`);
});
