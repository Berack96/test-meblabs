import Api from '../core/Api';

const getNDaysAgo = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const CashFlowApi = {
  listLatest: days => Api.get(`/cashflow`, { params: { dateMin: getNDaysAgo(days) } }),
  getById: id => Api.get(`/cashflow/${id}`),
  create: data => Api.post(`/cashflow`, data),
  update: (id, data) => Api.patch(`/cashflow/${id}`, data),
  delete: id => Api.delete(`/cashflow/${id}`)
};

export default CashFlowApi;
