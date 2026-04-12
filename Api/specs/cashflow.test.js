const supertest = require('supertest');

const app = require('../app');
const db = require('../db/connect-test');
const Company = require('../models/company');
const User = require('../models/user');
const CashFlow = require('../models/cashflow');
const { genereteAuthToken } = require('../helpers/auth');

jest.mock('../helpers/secrets.js');

const agent = supertest.agent(app);

let company1;
let company2;
let superuser;
let superToken;
let admin;
let adminToken;
let user;
let userToken;
let otherUser;
let adminCashflow;
let userCashflow;
let otherCompanyCashflow;

const createCashflow = async ({ userId, company, date, type, amount, category, description }) =>
  new CashFlow({
    user: userId,
    company: { id: company.id, name: company.name },
    date,
    type,
    amount,
    category,
    description
  }).save();

beforeAll(async () => await db.connect());
beforeEach(async () => {
  await db.clear();

  company1 = await new Company({
    name: 'Company1',
    lang: 'EN',
    type: 'type1'
  }).save();

  company2 = await new Company({
    name: 'Company2',
    lang: 'EN',
    type: 'type2'
  }).save();

  superuser = await new User({
    name: 'Super',
    lastname: 'Admin',
    email: 'superuser@meblabs.com',
    password: 'testtest',
    roles: ['superuser'],
    active: true,
    lang: 'EN'
  }).save();
  superToken = genereteAuthToken(superuser).token;

  admin = await new User({
    email: 'admin@company1.com',
    password: 'testtest',
    name: 'Admin',
    lastname: 'User',
    lang: 'EN',
    active: true,
    company: {
      id: company1.id,
      name: company1.name,
      type: 'type1',
      roles: ['admin']
    }
  }).save();
  adminToken = genereteAuthToken(admin).token;

  user = await new User({
    email: 'user@company1.com',
    password: 'testtest',
    name: 'User',
    lastname: 'One',
    lang: 'EN',
    active: true,
    company: {
      id: company1.id,
      name: company1.name,
      type: 'type1',
      roles: ['user']
    }
  }).save();
  userToken = genereteAuthToken(user).token;

  otherUser = await new User({
    email: 'user@company2.com',
    password: 'testtest',
    name: 'User',
    lastname: 'Two',
    lang: 'EN',
    active: true,
    company: {
      id: company2.id,
      name: company2.name,
      type: 'type2',
      roles: ['user']
    }
  }).save();

  adminCashflow = await createCashflow({
    userId: admin.id,
    company: company1,
    date: new Date('2026-01-10T10:00:00.000Z'),
    type: 'income',
    amount: 150000,
    category: 'salary',
    description: 'Admin salary'
  });

  userCashflow = await createCashflow({
    userId: user.id,
    company: company1,
    date: new Date('2026-01-11T10:00:00.000Z'),
    type: 'expense',
    amount: 5000,
    category: 'food',
    description: 'Lunch'
  });

  otherCompanyCashflow = await createCashflow({
    userId: otherUser.id,
    company: company2,
    date: new Date('2026-01-12T10:00:00.000Z'),
    type: 'income',
    amount: 75000,
    category: 'consulting',
    description: 'Side job'
  });
});
afterEach(() => jest.clearAllMocks());
afterAll(async () => await db.close());

describe('Role: Superuser', () => {
  describe('GET /cashflows', () => {
    test('Get only own cashflows of a company', () =>
      agent
        .get(`/cashflows?sorter=date`)
        .set('Cookie', `accessToken=${superToken}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual([]);
        }));

    test('Get own cashflows paginated', () =>
      agent
        .get(`/cashflows?sorter=date&count=true&limit=1`)
        .set('Cookie', `accessToken=${superToken}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual([]);
          expect(res.headers['x-total-count']).toBe('0');
        }));
  });

  describe('GET /companies/:companyId/cashflows/:id', () => {
    test('Get cashflow in another company', () =>
      agent
        .get(`/cashflows/${otherCompanyCashflow.id}`)
        .set('Cookie', `accessToken=${superToken}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: otherCompanyCashflow.id,
            type: 'income',
            amount: 75000,
            date: '2026-01-12T10:00:00.000Z',
            category: 'consulting',
            description: 'Side job',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: otherUser.id,
            company: {
              id: company2.id,
              name: company2.name
            }
          })
        ));
  });
});

describe('Role: Admin', () => {
  describe('GET /cashflows', () => {
    test('Filter own cashflows by type', async () => {
      await createCashflow({
        userId: admin.id,
        company: company1,
        date: new Date('2026-02-10T10:00:00.000Z'),
        type: 'expense',
        amount: 3200,
        category: 'travel',
        description: 'Train ticket'
      });

      return agent
        .get('/cashflows?type=expense&sorter=date')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual([
            {
              _id: expect.any(String),
              type: 'expense',
              amount: 3200,
              date: '2026-02-10T10:00:00.000Z',
              category: 'travel',
              createdAt: expect.any(String)
            }
          ]);
        });
    });
  });

  describe('GET /cashflows/summary', () => {
    test('Group own cashflows by month', async () => {
      await createCashflow({
        userId: admin.id,
        company: company1,
        date: new Date('2026-01-20T10:00:00.000Z'),
        type: 'expense',
        amount: 2000,
        category: 'office',
        description: 'Office chairs'
      });

      await createCashflow({
        userId: admin.id,
        company: company1,
        date: new Date('2026-02-01T09:00:00.000Z'),
        type: 'income',
        amount: 1000,
        category: 'bonus',
        description: 'Project bonus'
      });

      return agent
        .get('/cashflows/summary')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual([
            {
              _id: { year: 2026, month: 1 },
              total: 152000,
              average: 76000,
              count: 2
            },
            {
              _id: { year: 2026, month: 2 },
              total: 1000,
              average: 1000,
              count: 1
            }
          ]);
        });
    });

    test('Apply query filters on summary', async () => {
      await createCashflow({
        userId: admin.id,
        company: company1,
        date: new Date('2026-02-01T09:00:00.000Z'),
        type: 'expense',
        amount: 1000,
        category: 'office',
        description: 'Office supplies'
      });

      await createCashflow({
        userId: admin.id,
        company: company1,
        date: new Date('2026-02-10T09:00:00.000Z'),
        type: 'expense',
        amount: 3000,
        category: 'office',
        description: 'New monitor'
      });

      return agent
        .get('/cashflows/summary?type=expense&amountMin=2000&dateMin=2026-02-01T00:00:00.000Z')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual([
            {
              _id: { year: 2026, month: 2 },
              total: 3000,
              average: 3000,
              count: 1
            }
          ]);
        });
    });
  });

  describe('POST /companies/:companyId/cashflows', () => {
    test('Create a cashflow', () =>
      agent
        .post(`/cashflows`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          type: 'expense',
          amount: 12345,
          date: '2026-02-01T12:30:00.000Z',
          category: 'office',
          description: 'Printer ink'
        })
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: expect.any(String),
            type: 'expense',
            amount: 12345,
            date: '2026-02-01T12:30:00.000Z',
            category: 'office',
            description: 'Printer ink',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: admin.id,
            company: {
              id: company1.id,
              name: company1.name
            }
          })
        ));

    test('Missing amount should be rejected', () =>
      agent
        .post(`/cashflows`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          type: 'income',
          date: '2026-02-01T12:30:00.000Z',
          category: 'salary',
          description: 'Monthly salary'
        })
        .expect(400)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 201,
            message: 'Missing required parameters',
            data: '/amount'
          })
        ));

    test('Cannot forge user in payload', () =>
      agent
        .post(`/cashflows`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          type: 'income',
          amount: 12345,
          date: '2026-02-01T12:30:00.000Z',
          user: admin.id
        })
        .expect(400)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 202,
            message: 'Additional parameters are not permitted',
            data: '/user'
          })
        ));
  });

  describe('PATCH /companies/:companyId/cashflows/:id', () => {
    test('Update a cashflow', () =>
      agent
        .patch(`/cashflows/${userCashflow.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          amount: 6000,
          category: 'transport',
          description: 'Taxi to office'
        })
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: userCashflow.id,
            type: 'expense',
            amount: 6000,
            date: '2026-01-11T10:00:00.000Z',
            category: 'transport',
            description: 'Taxi to office',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: user.id,
            company: {
              id: company1.id,
              name: company1.name
            }
          })
        ));
  });

  describe('DELETE /companies/:companyId/cashflows/:id', () => {
    test('Delete a cashflow', () =>
      agent
        .delete(`/cashflows/${adminCashflow.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            message: 'CashFlow deleted successfully'
          })
        )
        .then(() =>
          agent.get(`/cashflows/${adminCashflow.id}`).set('Cookie', `accessToken=${adminToken}`).expect(404)
        ));
  });
});

describe('Role: User', () => {
  describe('GET /companies/:companyId/cashflows', () => {
    test('Get only own cashflows in own company', () =>
      agent
        .get(`/cashflows?sorter=date`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual([
            {
              _id: userCashflow.id,
              type: 'expense',
              amount: 5000,
              date: '2026-01-11T10:00:00.000Z',
              category: 'food',
              createdAt: expect.any(String)
            }
          ])
        ));
  });

  describe('GET /companies/:companyId/cashflows/:id', () => {
    test('Get own cashflow', () =>
      agent
        .get(`/cashflows/${userCashflow.id}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: userCashflow.id,
            type: 'expense',
            amount: 5000,
            date: '2026-01-11T10:00:00.000Z',
            category: 'food',
            description: 'Lunch',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: user.id,
            company: {
              id: company1.id,
              name: company1.name
            }
          })
        ));

    test('Cannot access other users cashflow', () =>
      agent
        .get(`/cashflows/${adminCashflow.id}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(401)
        .then(res => expect(res.body).toEqual(expect.objectContaining({ error: 401 }))));
  });
});
