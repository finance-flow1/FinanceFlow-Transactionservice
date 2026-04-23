const svc       = require('../services/transactionService');
const logger    = require('../utils/logger');
const publisher = require('../mq/publisher');

const create = async (req, res, next) => {
  try {
    const tx = await svc.create(req.userId, req.body);
    logger.info(`Transaction created: id=${tx.id} user=${req.userId}`);
    res.status(201).json({ success: true, data: tx });

    // Publish to RabbitMQ after response is sent (non-blocking)
    const emoji = tx.type === 'income' ? '📈' : '📉';
    publisher.publish({
      userId:  req.userId,
      type:    tx.type === 'income' ? 'success' : 'info',
      title:   `${emoji} ${tx.type === 'income' ? 'Income' : 'Expense'} recorded`,
      message: `$${parseFloat(tx.amount).toFixed(2)} — ${tx.category}`,
    });
  } catch (err) { next(err); }
};


const list = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const result = await svc.list(req.userId, {
      type, category, startDate, endDate,
      page:  Math.max(1, parseInt(page)),
      limit: Math.min(100, Math.max(1, parseInt(limit))),
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const tx = await svc.getById(parseInt(req.params.id), req.userId);
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const tx = await svc.update(parseInt(req.params.id), req.userId, req.body);
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await svc.remove(parseInt(req.params.id), req.userId);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await svc.analytics(req.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getAdminStats = async (req, res, next) => {
  try {
    const data = await svc.adminStats();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { create, list, getById, update, remove, getAnalytics, getAdminStats };
