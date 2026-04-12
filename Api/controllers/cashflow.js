const mongoose = require('mongoose');
const CashFlow = require('../models/cashflow');
const { SendData, ServerError, NotFound, Unauthorized } = require('../helpers/response');
const { canGetCashFlow, canUpdateCashFlow, canDeleteCashFlow } = require('../rbac/cashflow');
const getter = require('../helpers/getter');

const cashflowQuery = (user, { category, type, dateMax, dateMin, amountMin, amountMax }) => {
  const query = {};

  if (user?.id) {
    query.user = new mongoose.Types.ObjectId(user.id);
  }

  if (user?.company?.id) {
    query['company.id'] = new mongoose.Types.ObjectId(user.company.id);
  }

  if (category) {
    query.category = category;
  }

  if (type) {
    query.type = type;
  }

  if (dateMax) {
    query.date = { $lte: new Date(dateMax) };
  }

  if (dateMin) {
    query.date = { ...query.date, $gte: new Date(dateMin) };
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
  company: user.company?.id
});

module.exports.get = async (req, res, next) => {
  try {
    const query = cashflowQuery(res.locals.user, req.query);
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

module.exports.create = async (req, { locals: { user, company } }, next) => {
  try {
    const data = new CashFlow(req.body);
    data.user = user.id;
    const tempCompany = { id: user.company?.id, name: user.company?.name };
    if (tempCompany.id) data.company = tempCompany;

    data.__history = newHistory(user, 'create', 'create');
    await data.save();

    return next(SendData(data.response('detail')));
  } catch (err) {
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

module.exports.groupByMonth = async (req, { locals: { user } }, next) => {
  try {
    const query = cashflowQuery(user, req.query);
    const data = await CashFlow.aggregate([
      { $match: query },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m', date: '$date' } }, type: '$type' },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          items: { $push: { type: '$_id.type', total: '$total' } }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          data: { $arrayToObject: { $map: { input: '$items', as: 'item', in: ['$$item.type', '$$item.total'] } } }
        }
      },
      { $sort: { date: 1 } }
    ]);

    console.log(data);
    return next(SendData(data));
  } catch (err) {
    return next(ServerError(err));
  }
};
