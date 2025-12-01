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

exports.getShiftHistory = async (req, res) => {
  try {
    const { date, user_id } = req.query;

    let query = `
      SELECT s.*, u.full_name as kasir_name
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // All authenticated users can see all shifts
    // Filter by user_id if provided in query
    if (user_id) {
      query += ' AND s.user_id = ?';
      params.push(user_id);
    }

    // Filter by date if provided
    if (date) {
      query += ' AND DATE(s.start_time) = ?';
      params.push(date);
    }

    query += ' ORDER BY s.start_time DESC LIMIT 50';

    const [shifts] = await pool.query(query, params);

    res.json({
      success: true,
      data: shifts
    });
  } catch (error) {
    console.error('Get shift history error:', error);
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

    // Get cash flows (include id so frontend can reference/delete entries)
    const [cashFlows] = await pool.query(
      `SELECT id, type, name, amount, created_at
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

exports.deleteCashFlow = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cashFlowId = req.params.id;
    const user_id = req.user.id;

    // Fetch cash flow
    const [rows] = await conn.query(
      'SELECT id, shift_id, type, amount FROM cash_flows WHERE id = ?',
      [cashFlowId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Cash flow not found' });
    }

    const cashFlow = rows[0];

    // Verify shift belongs to the authenticated user
    const [shifts] = await conn.query('SELECT id, user_id, expected_cash, cash_in, cash_out FROM shifts WHERE id = ?', [cashFlow.shift_id]);
    if (shifts.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    const shift = shifts[0];
    if (shift.user_id !== user_id) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Not authorized to modify this cash flow' });
    }

    const amount = Number(cashFlow.amount) || 0;

    // Delete the cash flow
    await conn.query('DELETE FROM cash_flows WHERE id = ?', [cashFlowId]);

    // Reverse the cash flow effect on the shift
    let expectedChange = 0;
    let cashInChange = 0;
    let cashOutChange = 0;

    if (cashFlow.type === 'in') {
      expectedChange = -amount;
      cashInChange = -amount;
    } else if (cashFlow.type === 'out') {
      expectedChange = amount;
      cashOutChange = -amount;
    }

    await conn.query(
      `UPDATE shifts SET expected_cash = expected_cash + ?,
         cash_in = GREATEST(0, cash_in + ?),
         cash_out = GREATEST(0, cash_out + ?)
       WHERE id = ?`,
      [expectedChange, cashInChange, cashOutChange, cashFlow.shift_id]
    );

    // Insert into audit table for traceability. Create table if not exists.
    await conn.query(
      `CREATE TABLE IF NOT EXISTS cash_flow_audit (
         id INT AUTO_INCREMENT PRIMARY KEY,
         cash_flow_id INT,
         shift_id INT,
         performed_by INT,
         action VARCHAR(50),
         type VARCHAR(10),
         amount DECIMAL(15,2),
         reason TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    );

    await conn.query(
      `INSERT INTO cash_flow_audit (cash_flow_id, shift_id, performed_by, action, type, amount)
       VALUES (?, ?, ?, 'delete', ?, ?)`,
      [cashFlowId, cashFlow.shift_id, user_id, cashFlow.type, amount]
    );

    await conn.commit();

    res.json({ success: true, message: 'Cash flow deleted successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Delete cash flow error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};
