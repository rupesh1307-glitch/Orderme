const { db } = require('../config/db');

// POST /api/payment/process
function processPayment(req, res) {
  try {
    const { orderId, orderNumber, paymentMethod, paymentDetails } = req.body;

    if (!orderId && !orderNumber) {
      return res.status(400).json({ success: false, message: 'Order reference is required.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(orderId || 0, orderNumber || '');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.payment_status === 'Completed') {
      return res.json({
        success: true,
        message: 'Payment has already been completed for this order.',
        data: {
          orderNumber: order.order_number,
          transactionId: order.transaction_id,
          amount: order.total_amount,
          status: 'Completed'
        }
      });
    }

    const txnId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    if (paymentMethod === 'card') {
      if (!paymentDetails || !paymentDetails.cardNumber) {
        return res.status(400).json({ success: false, message: 'Please provide valid card details.' });
      }
    }

    // Update order payment status
    db.prepare(`
      UPDATE orders
      SET payment_status = 'Completed',
          payment_method = ?,
          transaction_id = ?,
          status = CASE WHEN status = 'Placed' THEN 'Confirmed' ELSE status END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(paymentMethod || order.payment_method, txnId, order.id);

    // Add tracking event
    db.prepare(`
      INSERT INTO order_tracking (order_id, status, title, description, location)
      VALUES (?, 'Confirmed', 'Payment Verified & Order Confirmed', 'Payment of ₹' || ? || ' received successfully via ' || UPPER(?), 'OrderMe Payments Gateway')
    `).run(order.id, order.total_amount, paymentMethod || order.payment_method);

    res.json({
      success: true,
      message: 'Payment processed and verified successfully!',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        transactionId: txnId,
        amount: order.total_amount,
        paymentMethod: paymentMethod || order.payment_method,
        status: 'Completed',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('processPayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed. Please try again.'
    });
  }
}

// POST /api/payment/verify-upi
function verifyUPI(req, res) {
  try {
    const { orderId, upiId } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(orderId, orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const txnId = `UPI_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;

    db.prepare(`
      UPDATE orders
      SET payment_status = 'Completed',
          payment_method = 'upi',
          transaction_id = ?,
          status = 'Confirmed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(txnId, order.id);

    db.prepare(`
      INSERT INTO order_tracking (order_id, status, title, description, location)
      VALUES (?, 'Confirmed', 'UPI Payment Confirmed', 'UPI Transaction ID: ' || ?, 'UPI Gateway Engine')
    `).run(order.id, txnId);

    res.json({
      success: true,
      message: 'UPI transaction verified!',
      data: {
        orderNumber: order.order_number,
        transactionId: txnId,
        amount: order.total_amount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'UPI verification failed.'
    });
  }
}

module.exports = {
  processPayment,
  verifyUPI
};
