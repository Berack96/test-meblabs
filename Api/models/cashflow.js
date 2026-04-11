const mongoose = require('mongoose');
const softDelete = require('../helpers/softDelete');
const dbFields = require('../helpers/dbFields');
const mongooseHistory = require('../helpers/mongooseHistory');

const { Schema } = mongoose;

const schema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    company: {
      _id: false,
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        index: true
      },
      name: {
        type: String,
        maxlength: 128,
        trim: true
      }
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      maxlength: 128,
      trim: true,
      index: true
    },
    description: {
      type: String,
      maxlength: 512,
      trim: true
    }
  },
  {
    timestamps: true
  }
);
schema.plugin(softDelete);
schema.plugin(dbFields, {
  fields: {
    listing: ['_id', 'type', 'amount', 'date', 'category', 'createdAt'],
    public: ['_id', 'type', 'amount', 'date', 'category', 'description', 'createdAt', 'updatedAt'],
    detail: ['_id', 'type', 'amount', 'date', 'category', 'description', 'createdAt', 'updatedAt', 'user', 'company']
  }
});

schema.plugin(
  mongooseHistory({
    mongoose,
    modelName: 'cashflow_h',
    userCollection: 'User',
    accountCollection: 'Company',
    userFieldName: 'user',
    accountFieldName: 'company'
  })
);

module.exports = mongoose.models.CashFlow || mongoose.model('CashFlow', schema);
