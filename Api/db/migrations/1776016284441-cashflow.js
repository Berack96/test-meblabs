/* eslint-disable no-console */
const User = require('../../models/user');
const CashFlow = require('../../models/cashflow');
require('../connect');

const ADMIN_EMAIL = 'test@meblabs.com';
const SEED_PREFIX = '[seed-cashflow-14m]';
const DAYS_IN_MONTH = [4, 11, 19, 26];
const CATEGORIES = {
  income: ['Salary', 'Consulting', 'Bonus', 'Refund'],
  expense: ['Rent', 'Utilities', 'Groceries', 'Transport', 'Software', 'Maintenance']
};

const monthStart = (referenceDate, monthsBack) =>
  new Date(referenceDate.getFullYear(), referenceDate.getMonth() - monthsBack, 1, 10, 0, 0, 0);

const buildCashflows = user => {
  const records = [];
  const now = new Date();
  let globalIndex = 0;

  for (let monthOffset = 0; monthOffset < 14; monthOffset += 1) {
    const entriesInMonth = monthOffset < 8 ? 4 : 3;
    const baseDate = monthStart(now, monthOffset);

    for (let entryIndex = 0; entryIndex < entriesInMonth; entryIndex += 1) {
      const preferIncome = globalIndex % 2 === 0 || globalIndex === 11;
      const type = preferIncome ? 'income' : 'expense';
      const amount = type === 'income' ? 980 + (globalIndex % 5) * 120 : 860 + (globalIndex % 6) * 105;

      const day = DAYS_IN_MONTH[entryIndex];
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), day, 9 + (entryIndex % 3), 30, 0, 0);

      const categoryList = CATEGORIES[type];
      const category = categoryList[globalIndex % categoryList.length];

      const cashflow = {
        user: user._id,
        date,
        type,
        amount,
        category,
        description: `${SEED_PREFIX} ${type} ${monthOffset + 1}-${entryIndex + 1}`
      };

      if (user.company?.id) {
        cashflow.company = {
          id: user.company.id,
          name: user.company.name
        };
      }

      records.push(cashflow);
      globalIndex += 1;
    }
  }

  return records;
};

module.exports.up = async function () {
  const admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    throw new Error(`Admin user not found: ${ADMIN_EMAIL}`);
  }

  await CashFlow.deleteMany({ user: admin._id, description: { $regex: `^\\${SEED_PREFIX}` } });

  const records = buildCashflows(admin);
  return CashFlow.insertMany(records);
};

module.exports.down = async () => {
  const admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) return null;

  return CashFlow.deleteMany({ user: admin._id, description: { $regex: `^\\${SEED_PREFIX}` } });
};
