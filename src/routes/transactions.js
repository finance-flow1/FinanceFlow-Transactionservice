const router = require('express').Router();
const ctrl   = require('../controllers/transactionController');
const { validate, transactionSchema } = require('../middleware/validate');
const { verifyToken, requireAdmin }   = require('../middleware/auth');

// All transaction routes require auth
router.use(verifyToken);

// Admin: global stats (must be before /:id)
router.get('/admin/stats', requireAdmin, ctrl.getAdminStats);

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management and analytics
 */

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions (paginated + filtered)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of transactions
 */
router.get('/', ctrl.list);

/**
 * @swagger
 * /api/v1/transactions/analytics/summary:
 *   get:
 *     tags: [Transactions]
 *     summary: Get financial analytics (balance, monthly report, category breakdown)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics summary
 */
router.get('/analytics/summary', ctrl.getAnalytics);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transaction object
 *       404:
 *         description: Not found
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/v1/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a new transaction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount, category, date]
 *             properties:
 *               type:        { type: string, enum: [income, expense] }
 *               amount:      { type: number, example: 1500.00 }
 *               category:    { type: string, example: Salary }
 *               description: { type: string, example: Monthly salary }
 *               date:        { type: string, format: date, example: "2024-01-15" }
 *     responses:
 *       201:
 *         description: Transaction created
 */
router.post('/', validate(transactionSchema), ctrl.create);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   put:
 *     tags: [Transactions]
 *     summary: Update a transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       200:
 *         description: Transaction updated
 */
router.put('/:id', validate(transactionSchema), ctrl.update);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   delete:
 *     tags: [Transactions]
 *     summary: Delete a transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transaction deleted
 */
router.delete('/:id', ctrl.remove);

module.exports = router;
