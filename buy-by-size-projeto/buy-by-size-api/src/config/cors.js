const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://buy-your-size.vercel.app',
  'https://village23.com.br',
  'https://expert-couscous-vj9xr7wp7q5c4qx-5173.app.github.dev',
  'https://expert-couscous-vj9xr7wp7q5c4qx-5500.app.github.dev',
  'https://bino5.lojavirtualnuvem.com.br'
];

const baseCorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const strictCorsOptions = {
  ...baseCorsOptions,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204
};

module.exports = {
  allowedOrigins,
  baseCorsOptions,
  strictCorsOptions
};
