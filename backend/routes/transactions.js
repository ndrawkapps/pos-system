const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, transactionController.createTransaction);
router.get('/', authenticate, transactionController.getTransactions);
router.get('/:id', authenticate, transactionController.getTransactionDetail);
router.delete('/:id', authenticate, transactionController.deleteTransaction);
router.post('/held-orders', authenticate, transactionController.saveHeldOrder);
router.get('/held-orders/list', authenticate, transactionController.getHeldOrders);
router.delete('/held-orders/:id', authenticate, transactionController.deleteHeldOrder);

module.exports = router;