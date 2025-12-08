const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migrationController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin only - for running migrations
router.use(protect, adminOnly);

router.post('/run', migrationController.runMigration);
router.get('/check-tables', migrationController.checkTables);

module.exports = router;
