module.exports = {
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
