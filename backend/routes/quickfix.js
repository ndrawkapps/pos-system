const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// Quick fix endpoint - run once then remove
router.get('/fix-payment-enum', async (req, res) => {
  try {
    console.log('Running payment_method enum fix...');
    
    const sql = `ALTER TABLE transactions MODIFY COLUMN payment_method VARCHAR(50) NOT NULL`;
    
    await pool.query(sql);
    
    console.log('✅ Payment method column updated to VARCHAR(50)');
    
    res.json({
      success: true,
      message: 'Payment method column fixed successfully'
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
  }
});

module.exports = router;
