const CashFlow = require('../models/cashflow');
const { intersection } = require('../helpers/utils');

const cashflowRbac = async (caller, resourceId, { authorizedRoles = [], customCondition, onHimself = false }) => {
  const cashflow = await CashFlow.findById(resourceId, {});
  if (!cashflow) return null;

  const { id: _id, company, roles: globalRoles } = caller;
  const { roles: companyRoles } = company;
  const roles = Array.from(new Set([...companyRoles, ...globalRoles]));

  if (roles.includes('superuser')) return cashflow;
  if (onHimself && cashflow.user?.toString() === _id?.toString()) return cashflow;
  if (customCondition && customCondition(caller, cashflow) === true) return cashflow;

  if (company?.id?.toString() === cashflow?.company?.id?.toString() && intersection(authorizedRoles, roles).length)
    return cashflow;
  return false;
};

module.exports.cashflowRbac = cashflowRbac;

module.exports.canGetCashFlow = (caller, resourceId) =>
  cashflowRbac(caller, resourceId, { authorizedRoles: ['admin'], onHimself: true });

module.exports.canUpdateCashFlow = (caller, resourceId) =>
  cashflowRbac(caller, resourceId, { authorizedRoles: ['admin'], onHimself: true });

module.exports.canDeleteCashFlow = (caller, resourceId) =>
  cashflowRbac(caller, resourceId, { authorizedRoles: ['admin'], onHimself: true });
