const express = require('express');
const controller = require('../controllers/cashflow');
const { isAuth } = require('../middlewares/isAuth');
const rbac = require('../middlewares/rbac');
const { validator } = require('../middlewares/validator');

const router = express.Router();

router
  .route('/')
  .get(isAuth, rbac('cashflows', 'read:any'), controller.get)
  .post(validator('createCashFlow'), isAuth, rbac('cashflows', 'create:any'), controller.create);

router
  .route('/:id')
  .get(validator({ params: 'id' }), isAuth, rbac('cashflows', 'read'), controller.getById)
  .patch(validator({ params: 'id', body: 'updateCashFlow' }), isAuth, rbac('cashflows', 'update'), controller.update)
  .delete(validator({ params: 'id' }), isAuth, rbac('cashflows', 'delete'), controller.delete);

module.exports = router;
