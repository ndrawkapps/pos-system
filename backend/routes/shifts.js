const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/open', authenticate, shiftController.openShift);
router.post('/close', authenticate, shiftController.closeShift);
router.get('/current', authenticate, shiftController.getCurrentShift);
router.get('/history', authenticate, shiftController.getShiftHistory);
router.get('/:shift_id/summary', authenticate, shiftController.getShiftSummary);
router.post('/cash-flow', authenticate, shiftController.addCashFlow);
router.delete('/cash-flow/:id', authenticate, shiftController.deleteCashFlow);

module.exports = router;