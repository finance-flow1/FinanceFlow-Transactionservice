const transactionModel = require('../models/transactionModel');

const create = (userId, data) =>
  transactionModel.createTransaction({ userId, ...data });

const list = (userId, query) =>
  transactionModel.getTransactions({ userId, ...query });

const getById = async (id, userId) => {
  const tx = await transactionModel.getTransactionById(id, userId);
  if (!tx) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  return tx;
};

const update = async (id, userId, data) => {
  const tx = await transactionModel.updateTransaction(id, userId, data);
  if (!tx) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  return tx;
};

const remove = async (id, userId) => {
  const tx = await transactionModel.deleteTransaction(id, userId);
  if (!tx) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  return tx;
};

const analytics   = (userId) => transactionModel.getAnalytics(userId);
const adminStats  = ()       => transactionModel.getAdminStats();

module.exports = { create, list, getById, update, remove, analytics, adminStats };
