const notFound = (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
};

module.exports = notFound;
