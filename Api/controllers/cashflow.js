const CashFlow = require('../models/cashflow');
const { SendData, ServerError, NotFound, AlreadyExists, Unauthorized } = require('../helpers/response');
const { canGetCashFlow, canUpdateCashFlow, canDeleteCashFlow } = require('../rbac/cashflow');
const getter = require('../helpers/getter');

const cashflowQuery = ({ category, type, dateMax, dateMin, amountMin, amountMax }) => {
  const query = {};

  if (category) {
    query.category = category;
  }

  if (type) {
    query.type = type;
  }

  if (dateMax) {
    query.date = { $lte: dateMax };
  }

  if (dateMin) {
    query.date = { ...query.date, $gte: dateMin };
  }

  if (amountMin) {
    query.amount = { $gte: amountMin };
  }

  if (amountMax) {
    query.amount = { ...query.amount, $lte: amountMax };
  }

  return query;
};

const newHistory = (user, event, method) => ({
  event,
  method,
  user: user.id,
  company: user.company.id
});

module.exports.get = async (req, res, next) => {
  try {
    const query = cashflowQuery(req.query);
    const data = await getter(CashFlow, query, req, res, CashFlow.getFields('listing'));

    return next(SendData(data));
  } catch (err) {
    return next(ServerError(err));
  }
};

exports.getById = async ({ params: { id } }, { locals: { user } }, next) => {
  try {
    const data = await canGetCashFlow(user, id);
    if (data === null) return next(NotFound());
    if (!data) return next(Unauthorized());

    return next(SendData(data.response('detail')));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.create = async (req, { locals: { user } }, next) => {
  try {
    const data = new CashFlow(req.body);
    data.user = user.id;
    data.company = user.company.id;

    data.__history = newHistory(user, 'create', 'create');
    await data.save();

    return next(SendData(data.response('detail')));
  } catch (err) {
    if (err.code === 11000) return next(AlreadyExists());
    return next(ServerError(err));
  }
};

exports.update = async ({ params: { id }, body }, { locals: { user } }, next) => {
  try {
    const data = await canUpdateCashFlow(user, id);
    if (data === null) return next(NotFound());
    if (!data) return next(Unauthorized());

    const dataUpdate = Object.assign(data, body);
    dataUpdate.__history = newHistory(user, 'update', 'patch');
    await dataUpdate.save();

    return next(SendData(dataUpdate.response('detail')));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.delete = async ({ params: { id } }, { locals: { user } }, next) => {
  try {
    const data = await canDeleteCashFlow(user, id);
    if (data === null) return next(NotFound());
    if (!data) return next(Unauthorized());

    data.__history = newHistory(user, 'delete', 'delete');
    await data.softDelete();

    return next(SendData({ message: 'CashFlow deleted successfully' }));
  } catch (err) {
    return next(ServerError(err));
  }
};
