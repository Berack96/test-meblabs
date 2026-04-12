import Api from '../core/Api';

const getNDaysAgo = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const CashFlowApi = {
  list: params => Api.get('/cashflows', { params }),
  listSummary: params => Api.get('/cashflows/summary', { params }),
  listLatest: days => Api.get('/cashflows', { params: { dateMin: getNDaysAgo(days) } }),
  getById: id => Api.get(`/cashflows/${id}`),
  create: data => Api.post(`/cashflows`, data),
  update: (id, data) => Api.patch(`/cashflows/${id}`, data),
  delete: id => Api.delete(`/cashflows/${id}`)
};

export default CashFlowApi;
