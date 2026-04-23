const pool = require('../db/pool');

// ── Create ────────────────────────────────────────────
const createTransaction = async ({ userId, type, amount, category, description, date }) => {
  const { rows } = await pool.query(
    `INSERT INTO transactions (user_id, type, amount, category, description, date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, type, amount, category, description, date]
  );
  return rows[0];
};

// ── List with dynamic filtering + pagination ──────────
const getTransactions = async ({ userId, type, category, startDate, endDate, page = 1, limit = 10 }) => {
  const conditions = ['user_id = $1'];
  const values     = [userId];
  let   idx        = 2;

  if (type)      { conditions.push(`type = $${idx++}`);                   values.push(type); }
  if (category)  { conditions.push(`category ILIKE $${idx++}`);           values.push(`%${category}%`); }
  if (startDate) { conditions.push(`date >= $${idx++}`);                  values.push(startDate); }
  if (endDate)   { conditions.push(`date <= $${idx++}`);                  values.push(endDate); }

  const where  = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM transactions WHERE ${where}`, values),
    pool.query(
      `SELECT * FROM transactions WHERE ${where}
       ORDER BY date DESC, created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    ),
  ]);

  return {
    data: dataRes.rows,
    pagination: {
      total: parseInt(countRes.rows[0].count),
      page:  parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
    },
  };
};

// ── Read one ──────────────────────────────────────────
const getTransactionById = async (id, userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] || null;
};

// ── Update ────────────────────────────────────────────
const updateTransaction = async (id, userId, { type, amount, category, description, date }) => {
  const { rows } = await pool.query(
    `UPDATE transactions
     SET type = $1, amount = $2, category = $3, description = $4, date = $5
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [type, amount, category, description, date, id, userId]
  );
  return rows[0] || null;
};

// ── Delete ────────────────────────────────────────────
const deleteTransaction = async (id, userId) => {
  const { rows } = await pool.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return rows[0] || null;
};

// ── Analytics ─────────────────────────────────────────
const getAnalytics = async (userId) => {
  const [summary, monthly, categoryBreakdown] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0   END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0   END), 0) AS total_expense,
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE -amount END), 0) AS balance
       FROM transactions WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT
         TO_CHAR(date, 'YYYY-MM') AS month,
         SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
       FROM transactions
       WHERE user_id = $1 AND date >= NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month ASC`,
      [userId]
    ),
    pool.query(
      `SELECT category, type, SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1
       GROUP BY category, type
       ORDER BY total DESC`,
      [userId]
    ),
  ]);

  return {
    summary:           summary.rows[0],
    monthly:           monthly.rows,
    categoryBreakdown: categoryBreakdown.rows,
  };
};

// ── Admin global stats ────────────────────────────────
const getAdminStats = async () => {
  const summaryRes = await pool.query(
    `SELECT
       COUNT(*)::INTEGER                                                     AS total_transactions,
       COUNT(DISTINCT user_id)::INTEGER                                      AS active_users,
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0   END), 0)::NUMERIC AS total_income,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0   END), 0)::NUMERIC AS total_expense,
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE -amount END), 0)::NUMERIC AS net_balance,
       COALESCE(AVG(amount), 0)::NUMERIC                                     AS avg_transaction
     FROM transactions`
  );

  const monthlyRes = await pool.query(
    `SELECT
       TO_CHAR(date, 'YYYY-MM') AS month,
       COUNT(*)::INTEGER        AS count,
       SUM(CASE WHEN type='income'  THEN amount ELSE 0 END)::NUMERIC AS income,
       SUM(CASE WHEN type='expense' THEN amount ELSE 0 END)::NUMERIC AS expense
     FROM transactions
     WHERE date >= NOW() - INTERVAL '6 months'
     GROUP BY TO_CHAR(date, 'YYYY-MM')
     ORDER BY month ASC`
  );

  return { 
    summary: summaryRes.rows[0], 
    monthly: monthlyRes.rows 
  };
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getAnalytics,
  getAdminStats,
};
