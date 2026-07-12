const AppError = require('../errors/AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
};

module.exports = errorHandler;
