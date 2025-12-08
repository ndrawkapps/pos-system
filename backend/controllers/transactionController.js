const pool = require('../config/database');

exports.createTransaction = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      shift_id,
      items,
      order_type,
      table_number,
      payment_method,
      paid_amount,
      transaction_note,
      discount_type = 'none',
      discount_value = 0
    } = req.body;
    const user_id = req.user.id;

    // Debug logging
    console.log('Create transaction request:', {
      shift_id,
      items_count: items?.length,
      order_type,
      payment_method,
      discount_type,
      discount_value
    });
    
    if (items && items.length > 0) {
      console.log('First item sample:', items[0]);
    }

    if (!shift_id || !items || items.length === 0 || !payment_method) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // ============ STOCK CHECK & PREPARATION ============
    const stockDeductions = []; // Track what needs to be deducted
    
    for (const item of items) {
      // Check if product has recipe
      const [recipes] = await conn.query(
        `SELECT pr.ingredient_id, pr.quantity_needed, i.name as ingredient_name, 
                i.current_stock, i.unit
         FROM product_recipes pr
         JOIN ingredients i ON pr.ingredient_id = i.id
         WHERE pr.product_id = ? AND i.is_active = 1`,
        [item.id]
      );
      
      // If product has recipe, check stock availability
      if (recipes.length > 0) {
        for (const recipe of recipes) {
          const needed = recipe.quantity_needed * item.quantity;
          const available = parseFloat(recipe.current_stock);
          
          if (available < needed) {
            await conn.rollback();
            return res.status(400).json({
              success: false,
              message: `Stok tidak cukup untuk ${item.name}. Bahan ${recipe.ingredient_name} hanya tersisa ${available} ${recipe.unit}, dibutuhkan ${needed} ${recipe.unit}`
            });
          }
          
          // Track for deduction
          stockDeductions.push({
            ingredient_id: recipe.ingredient_id,
            ingredient_name: recipe.ingredient_name,
            quantity: needed,
            stock_before: available,
            unit: recipe.unit
          });
        }
      }
      // If no recipe, product can be sold without stock check (backward compatible)
    }

    // Calculate subtotal with per-item discounts
    let subtotal = 0;
    items.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      
      // Calculate per-item discount with safe defaults
      let itemDiscountAmount = 0;
      const itemDiscountType = item.discount_type || 'none';
      const itemDiscountValue = parseFloat(item.discount_value) || 0;
      
      if (itemDiscountType === 'percentage' && itemDiscountValue > 0) {
        itemDiscountAmount = (itemSubtotal * itemDiscountValue) / 100;
      } else if (itemDiscountType === 'nominal' && itemDiscountValue > 0) {
        itemDiscountAmount = itemDiscountValue;
      }
      
      // Add to subtotal (after item discount)
      subtotal += itemSubtotal - itemDiscountAmount;
    });

    // Calculate order-level discount amount
    let discount_amount = 0;
    if (discount_type === 'percentage' && discount_value > 0) {
      discount_amount = (subtotal * discount_value) / 100;
    } else if (discount_type === 'nominal' && discount_value > 0) {
      discount_amount = discount_value;
    }

    // Calculate final total (subtotal already includes item discounts)
    const total = subtotal - discount_amount;

    const change_amount = payment_method === 'Tunai' && paid_amount 
      ? paid_amount - total 
      : 0;

    // Insert transaction
    const [transactionResult] = await conn.query(
      `INSERT INTO transactions 
       (shift_id, user_id, order_type, table_number, payment_method, 
        subtotal, discount_type, discount_value, discount_amount, total, 
        paid_amount, change_amount, transaction_note, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [
        shift_id, user_id, order_type || 'Dine-In', table_number, 
        payment_method, subtotal, discount_type, discount_value, discount_amount, total, 
        paid_amount || total, change_amount, transaction_note
      ]
    );

    const transaction_id = transactionResult.insertId;

    // Insert transaction items with per-item discounts
    for (const item of items) {
      const itemSubtotal = item.price * item.quantity;
      
      // Calculate per-item discount with safe defaults
      let itemDiscountAmount = 0;
      const itemDiscountType = item.discount_type || 'none';
      const itemDiscountValue = parseFloat(item.discount_value) || 0;
      
      if (itemDiscountType === 'percentage' && itemDiscountValue > 0) {
        itemDiscountAmount = (itemSubtotal * itemDiscountValue) / 100;
      } else if (itemDiscountType === 'nominal' && itemDiscountValue > 0) {
        itemDiscountAmount = itemDiscountValue;
      }
      
      const itemTotal = itemSubtotal - itemDiscountAmount;
      
      await conn.query(
        `INSERT INTO transaction_items 
         (transaction_id, product_id, product_name, price, quantity, subtotal, 
          discount_type, discount_value, discount_amount, total, item_note) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction_id, item.id, item.name, item.price, 
          item.quantity, itemSubtotal, itemDiscountType, itemDiscountValue, 
          itemDiscountAmount, itemTotal, item.note || null
        ]
      );
    }

    // ============ DEDUCT STOCK & LOG MOVEMENTS ============
    for (const deduction of stockDeductions) {
      const stock_after = deduction.stock_before - deduction.quantity;
      
      // Update ingredient stock
      await conn.query(
        'UPDATE ingredients SET current_stock = ? WHERE id = ?',
        [stock_after, deduction.ingredient_id]
      );
      
      // Log stock movement
      await conn.query(
        `INSERT INTO stock_movements 
         (ingredient_id, movement_type, quantity, stock_before, stock_after, 
          reference_type, reference_id, notes, created_by)
         VALUES (?, 'out', ?, ?, ?, 'transaction', ?, ?, ?)`,
        [
          deduction.ingredient_id,
          deduction.quantity,
          deduction.stock_before,
          stock_after,
          transaction_id,
          `Transaksi #${transaction_id}`,
          user_id
        ]
      );
    }

    // Update shift totals (use final total after discount)
    if (payment_method === 'Tunai') {
      await conn.query(
        `UPDATE shifts 
         SET total_cash = total_cash + ?, expected_cash = expected_cash + ? 
         WHERE id = ?`,
        [total, total, shift_id]
      );
    } else {
      await conn.query(
        'UPDATE shifts SET total_non_cash = total_non_cash + ? WHERE id = ?',
        [total, shift_id]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction_id,
        subtotal,
        discount_type,
        discount_value,
        discount_amount,
        total,
        paid_amount: paid_amount || total,
        change_amount
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Create transaction error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    conn.release();
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { shift_id, start_date, end_date, payment_method } = req.query;

    let query = `
      SELECT t.*, u.full_name as kasir_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (shift_id) {
      query += ' AND t.shift_id = ?';
      params.push(shift_id);
    }

    if (start_date) {
      query += ' AND DATE(t.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(t.created_at) <= ?';
      params.push(end_date);
    }

    if (payment_method) {
      query += ' AND t.payment_method = ?';
      params.push(payment_method);
    }

    query += ' ORDER BY t.created_at DESC';

    const [transactions] = await pool.query(query, params);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTransactionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Get transaction
    const [transactions] = await pool.query(
      `SELECT t.*, u.full_name as kasir_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    // Get transaction items with category info
    const [items] = await pool.query(
      `SELECT ti.*, p.category_id, c.name as category_name
       FROM transaction_items ti
       LEFT JOIN products p ON ti.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ti.transaction_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...transactions[0],
        items
      }
    });
  } catch (error) {
    console.error('Get transaction detail error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.saveHeldOrder = async (req, res) => {
  try {
    const { shift_id, items, order_type, table_number, total, transaction_note } = req.body;
    const user_id = req.user.id;

    if (!shift_id || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check for duplicate held order in last 3 seconds (prevent double click)
    const itemsJson = JSON.stringify(items);
    const [recentOrders] = await pool.query(
      `SELECT id FROM held_orders 
       WHERE shift_id = ? 
       AND user_id = ? 
       AND items = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL 3 SECOND)
       LIMIT 1`,
      [shift_id, user_id, itemsJson]
    );

    if (recentOrders.length > 0) {
      console.log('Duplicate held order detected, ignoring');
      return res.status(200).json({
        success: true,
        message: 'Order already saved',
        data: { id: recentOrders[0].id, isDuplicate: true }
      });
    }

    const [result] = await pool.query(
      `INSERT INTO held_orders 
       (shift_id, user_id, order_type, table_number, items, total, transaction_note) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        shift_id, user_id, order_type, table_number, 
        itemsJson, total, transaction_note
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Order saved successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Save held order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHeldOrders = async (req, res) => {
  try {
    const { shift_id } = req.query;

    if (!shift_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Shift ID is required' 
      });
    }

    const [orders] = await pool.query(
      `SELECT * FROM held_orders 
       WHERE shift_id = ? 
       ORDER BY created_at DESC`,
      [shift_id]
    );

    // Parse items JSON safely. Some rows may already have items as objects
    // or may contain invalid JSON; handle both cases without throwing.
    orders.forEach(order => {
      try {
        if (typeof order.items === 'string') {
          const s = order.items.trim();
          // Only try JSON.parse if it looks like JSON (starts with [ or {)
          if (s.startsWith('[') || s.startsWith('{')) {
            order.items = JSON.parse(s || '[]');
          } else {
            console.warn('Warning: held_order.items for id', order.id, 'is a non-JSON string, coercing to empty array');
            order.items = [];
          }
        } else if (!order.items) {
          order.items = [];
        }
        // if it's already an object/array, leave as-is
      } catch (err) {
        console.warn('Warning: failed to parse held_order.items for id', order.id, err);
        order.items = [];
      }
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get held orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteHeldOrder = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM held_orders WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Held order deleted successfully'
    });
  } catch (error) {
    console.error('Delete held order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteTransaction = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;

    // Get transaction details before deleting
    const [transactions] = await conn.query(
      `SELECT t.*, s.status as shift_status 
       FROM transactions t
       LEFT JOIN shifts s ON t.shift_id = s.id
       WHERE t.id = ?`,
      [id]
    );

    if (transactions.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    const transaction = transactions[0];

    // Delete transaction items first (foreign key constraint)
    await conn.query('DELETE FROM transaction_items WHERE transaction_id = ?', [id]);

    // Delete the transaction
    await conn.query('DELETE FROM transactions WHERE id = ?', [id]);

    // If transaction belongs to current/open shift, update shift totals
    if (transaction.shift_status === 'open') {
      const amount = parseFloat(transaction.total) || 0;
      
      if (transaction.payment_method === 'Tunai') {
        // Update cash totals
        await conn.query(
          `UPDATE shifts 
           SET total_cash = GREATEST(total_cash - ?, 0),
               expected_cash = GREATEST(expected_cash - ?, 0)
           WHERE id = ?`,
          [amount, amount, transaction.shift_id]
        );
      } else {
        // Update non-cash totals
        await conn.query(
          `UPDATE shifts 
           SET total_non_cash = GREATEST(total_non_cash - ?, 0)
           WHERE id = ?`,
          [amount, transaction.shift_id]
        );
      }
    }

    await conn.commit();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    await conn.rollback();
    console.error('Delete transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};