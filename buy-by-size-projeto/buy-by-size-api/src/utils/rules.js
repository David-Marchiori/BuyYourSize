const sanitizePhraseArray = (list = []) =>
  list
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

const serializePhrases = (input) => {
  if (Array.isArray(input)) {
    const cleaned = sanitizePhraseArray(input);
    return cleaned.length ? JSON.stringify(cleaned) : null;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
};

const parsePhraseList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return sanitizePhraseArray(raw);

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return sanitizePhraseArray(parsed);
    } catch (err) {
      // fallback para texto simples
    }

    return sanitizePhraseArray(trimmed.split(/\r?\n/));
  }

  return [];
};

const evaluateCondition = (medidaCliente, operador, valorRegra) => {
  switch (operador) {
    case '>': return medidaCliente > valorRegra;
    case '>=': return medidaCliente >= valorRegra;
    case '<': return medidaCliente < valorRegra;
    case '<=': return medidaCliente <= valorRegra;
    case '==': return medidaCliente == valorRegra;
    case '!=': return medidaCliente != valorRegra;
    default: return false;
  }
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildFootConditions = (minVal, maxVal) => {
  if (minVal === null || maxVal === null) return [];
  return [
    { campo: 'pe', operador: '>=', valor: minVal },
    { campo: 'pe', operador: '<=', valor: maxVal }
  ];
};

const mapRuleWithPhrases = (rule) => {
  if (!rule) return rule;
  return {
    ...rule,
    frases_sugestao: parsePhraseList(rule.frase_sugestao)
  };
};

module.exports = {
  sanitizePhraseArray,
  serializePhrases,
  parsePhraseList,
  evaluateCondition,
  toNumber,
  buildFootConditions,
  mapRuleWithPhrases
};
