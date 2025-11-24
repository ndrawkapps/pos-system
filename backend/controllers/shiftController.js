const pool = require('../config/database');

exports.openShift = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { modal_awal } = req.body;
    const user_id = req.user.id;

    if (!modal_awal || modal_awal < 0) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Modal awal is required and must be positive' 
      });
    }

    // Check if there's already an open shift
    const [openShifts] = await conn.query(
      'SELECT id FROM shifts WHERE user_id = ? AND status = "open"',
      [user_id]
    );

    if (openShifts.length > 0) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an open shift' 
      });
    }

    const [result] = await conn.query(
      `INSERT INTO shifts (user_id, start_time, modal_awal, expected_cash, status) 
       VALUES (?, NOW(), ?, ?, 'open')`,
      [user_id, modal_awal, modal_awal]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Shift opened successfully',
      data: { shift_id: result.insertId }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Open shift error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.closeShift = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { shift_id, actual_cash } = req.body;
    const user_id = req.user.id;

    if (!shift_id || actual_cash === undefined) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Shift ID and actual cash are required' 
      });
    }

    // Get shift details
    const [shifts] = await conn.query(
      `SELECT * FROM shifts 
       WHERE id = ? AND user_id = ? AND status = 'open'`,
      [shift_id, user_id]
    );

    if (shifts.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Shift not found or already closed' 
      });
    }

    const shift = shifts[0];
    const difference = actual_cash - shift.expected_cash;

    await conn.query(
      `UPDATE shifts 
       SET end_time = NOW(), actual_cash = ?, difference = ?, status = 'closed' 
       WHERE id = ?`,
      [actual_cash, difference, shift_id]
    );

    await conn.commit();

    res.json({
      success: true,
      message: 'Shift closed successfully',
      data: {
        expected_cash: shift.expected_cash,
        actual_cash,
        difference
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Close shift error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getCurrentShift = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [shifts] = await pool.query(
      `SELECT s.*, u.full_name as kasir_name
       FROM shifts s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ? AND s.status = 'open'
       ORDER BY s.start_time DESC
       LIMIT 1`,
      [user_id]
    );

    if (shifts.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: shifts[0]
    });
  } catch (error) {
    console.error('Get current shift error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getShiftSummary = async (req, res) => {
  try {
    const { shift_id } = req.params;

    // Get shift details
    const [shifts] = await pool.query(
      'SELECT * FROM shifts WHERE id = ?',
      [shift_id]
    );

    if (shifts.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shift not found' 
      });
    }

    // Get payment breakdown
    const [payments] = await pool.query(
      `SELECT payment_method, SUM(total) as total
       FROM transactions
       WHERE shift_id = ? AND status = 'completed'
       GROUP BY payment_method`,
      [shift_id]
    );

    // Get cash flows
    const [cashFlows] = await pool.query(
      `SELECT type, name, amount, created_at
       FROM cash_flows
       WHERE shift_id = ?
       ORDER BY created_at ASC`,
      [shift_id]
    );

    res.json({
      success: true,
      data: {
        shift: shifts[0],
        payments,
        cashFlows
      }
    });
  } catch (error) {
    console.error('Get shift summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addCashFlow = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { shift_id, type, name, amount } = req.body;

    if (!shift_id || !type || !name || !amount) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (!['in', 'out'].includes(type)) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Type must be "in" or "out"' 
      });
    }

    // Insert cash flow
    await conn.query(
      'INSERT INTO cash_flows (shift_id, type, name, amount) VALUES (?, ?, ?, ?)',
      [shift_id, type, name, amount]
    );

    // Update shift expected cash
    const cashChange = type === 'in' ? amount : -amount;
    await conn.query(
      `UPDATE shifts 
       SET expected_cash = expected_cash + ?,
           cash_in = cash_in + ?,
           cash_out = cash_out + ?
       WHERE id = ?`,
      [cashChange, type === 'in' ? amount : 0, type === 'out' ? amount : 0, shift_id]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Cash flow added successfully'
    });
  } catch (error) {
    await conn.rollback();
    console.error('Add cash flow error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};
