const pool = require('../config/database');

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node smokeCashFlowTest.js <shift_id> <type:in|out> <amount> [name]');
    process.exit(1);
  }

  const shiftId = Number(args[0]);
  const type = args[1];
  const amount = Number(args[2]);
  const name = args[3] || (type === 'in' ? 'Test Income' : 'Test Expense');

  if (!shiftId || !['in', 'out'].includes(type) || isNaN(amount)) {
    console.error('Invalid arguments');
    process.exit(1);
  }

  const conn = await pool.getConnection();
  try {
    console.log('Starting smoke test for shift', shiftId);

    const [beforeRows] = await conn.query('SELECT expected_cash, cash_in, cash_out FROM shifts WHERE id = ?', [shiftId]);
    if (beforeRows.length === 0) {
      console.error('Shift not found');
      return;
    }
    console.log('Before:', beforeRows[0]);

    // Insert cash flow
    const [res] = await conn.query('INSERT INTO cash_flows (shift_id, type, name, amount) VALUES (?, ?, ?, ?)', [shiftId, type, name, amount]);
    const insertedId = res.insertId;
    console.log('Inserted cash_flow id=', insertedId);

    // Apply effect to shift similar to addCashFlow
    const cashChange = type === 'in' ? amount : -amount;
    await conn.query(
      `UPDATE shifts SET expected_cash = expected_cash + ?,
         cash_in = cash_in + ?,
         cash_out = cash_out + ?
       WHERE id = ?`,
      [cashChange, type === 'in' ? amount : 0, type === 'out' ? amount : 0, shiftId]
    );

    const [afterAdd] = await conn.query('SELECT expected_cash, cash_in, cash_out FROM shifts WHERE id = ?', [shiftId]);
    console.log('After add:', afterAdd[0]);

    // Now simulate delete logic
    const [cfRows] = await conn.query('SELECT id, shift_id, type, amount FROM cash_flows WHERE id = ?', [insertedId]);
    if (cfRows.length === 0) {
      console.error('Inserted cash flow not found');
      return;
    }
    const cf = cfRows[0];
    const am = Number(cf.amount) || 0;

    // Delete
    await conn.query('DELETE FROM cash_flows WHERE id = ?', [insertedId]);

    // Reverse effect
    let expectedChange = 0;
    let cashInChange = 0;
    let cashOutChange = 0;

    if (cf.type === 'in') {
      expectedChange = -am;
      cashInChange = -am;
    } else if (cf.type === 'out') {
      expectedChange = am;
      cashOutChange = -am;
    }

    await conn.query(
      `UPDATE shifts SET expected_cash = expected_cash + ?,
         cash_in = GREATEST(0, cash_in + ?),
         cash_out = GREATEST(0, cash_out + ?)
       WHERE id = ?`,
      [expectedChange, cashInChange, cashOutChange, shiftId]
    );

    const [afterDelete] = await conn.query('SELECT expected_cash, cash_in, cash_out FROM shifts WHERE id = ?', [shiftId]);
    console.log('After delete:', afterDelete[0]);

    console.log('Smoke test complete');
  } catch (err) {
    console.error('Smoke test error:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
