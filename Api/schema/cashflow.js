module.exports = {
  cashflowQuery: {
    $id: 'cashflowQuery',
    type: 'object',
    properties: {
      category: { type: 'string' },
      type: { type: 'string', enum: ['income', 'expense'] },
      dateMin: { type: 'string', format: 'date-time' },
      dateMax: { type: 'string', format: 'date-time' },
      amountMin: { type: 'number', minimum: 0 },
      amountMax: { type: 'number', minimum: 0 },
      sorter: { type: 'string' },
      count: { type: 'boolean' },
      nextKey: { type: 'string' },
      limit: { type: 'number', minimum: 0 }
    },
    additionalProperties: false
  },
  createCashFlow: {
    $id: 'createCashFlow',
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['income', 'expense'] },
      amount: { type: 'number', minimum: 0 },
      date: { type: 'string', format: 'date-time' },
      category: { type: 'string' },
      description: { type: 'string' }
    },
    required: ['type', 'amount', 'date'],
    additionalProperties: false
  },
  updateCashFlow: {
    $id: 'updateCashFlow',
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['income', 'expense'] },
      amount: { type: 'number', minimum: 0 },
      date: { type: 'string', format: 'date-time' },
      category: { type: 'string' },
      description: { type: 'string' }
    },
    additionalProperties: false
  }
};
