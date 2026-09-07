const { db } = require('../config/db');

// Helper to generate readable order number
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${randomStr}`;
}

// POST /api/orders
function createOrder(req, res) {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingCity,
      shippingPincode,
      paymentMethod = 'cod',
      items: directItems,
      notes
    } = req.body;

    const userId = req.user ? req.user.id : null;

    if (!customerName || !customerPhone || !shippingAddress || !shippingCity || !shippingPincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all delivery details (Name, Phone, Address, City, Pincode).'
      });
    }

    // Determine order items
    let orderItems = [];

    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      for (const item of directItems) {
        const prodId = item.id || item.productId;
        const qty = item.qty || item.quantity || 1;
        const product = db.prepare('SELECT id, title, price, stock, image FROM products WHERE id = ?').get(prodId);
        if (!product) {
          return res.status(400).json({ success: false, message: `Product #${prodId} no longer exists.` });
        }
        if (product.stock < qty) {
          return res.status(400).json({ success: false, message: `Insufficient stock for "${product.title}". Available: ${product.stock}` });
        }
        orderItems.push({
          product_id: product.id,
          title: product.title,
          price: product.price,
          quantity: qty,
          subtotal: product.price * qty,
          image: product.image
        });
      }
    } else if (userId) {
      const cartRows = db.prepare(`
        SELECT ci.quantity, ci.product_id, p.title, p.price, p.stock, p.image
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `).all(userId);

      if (cartRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty.' });
      }

      for (const row of cartRows) {
        if (row.stock < row.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for "${row.title}". Available: ${row.stock}` });
        }
        orderItems.push({
          product_id: row.product_id,
          title: row.title,
          price: row.price,
          quantity: row.quantity,
          subtotal: row.price * row.quantity,
          image: row.image
        });
      }
    } else {
      return res.status(400).json({ success: false, message: 'No items in order.' });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = subtotal > 1000 ? 0 : 49;
    const tax = 0;
    const totalAmount = subtotal + shippingFee + tax;
    const orderNumber = generateOrderNumber();
    const paymentStatus = 'Pending';
    const transactionId = paymentMethod === 'cod' ? null : `TXN_${Date.now()}`;

    // Execute order creation
    db.exec('BEGIN TRANSACTION');
    try {
      const insertOrderStmt = db.prepare(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          shipping_address, shipping_city, shipping_pincode,
          subtotal, shipping_fee, tax, total_amount,
          status, payment_method, payment_status, transaction_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Placed', ?, ?, ?, ?)
      `);

      const orderResult = insertOrderStmt.run(
        orderNumber,
        userId,
        customerName.trim(),
        customerEmail || (req.user ? req.user.email : null),
        customerPhone.trim(),
        shippingAddress.trim(),
        shippingCity.trim(),
        shippingPincode.trim(),
        subtotal,
        shippingFee,
        tax,
        totalAmount,
        paymentMethod,
        paymentStatus,
        transactionId,
        notes || null
      );

      const orderId = orderResult.lastInsertRowid;

      const insertItemStmt = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_title, price, quantity, subtotal, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE products SET stock = stock - ? WHERE id = ?
      `);

      for (const item of orderItems) {
        insertItemStmt.run(
          orderId,
          item.product_id,
          item.title,
          item.price,
          item.quantity,
          item.subtotal,
          item.image
        );
        updateStockStmt.run(item.quantity, item.product_id);
      }

      // Clear user's cart if user is logged in
      if (userId) {
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
      }

      // Add initial tracking step
      db.prepare(`
        INSERT INTO order_tracking (order_id, status, title, description, location)
        VALUES (?, 'Placed', 'Order Placed Successfully', 'Your order has been received and is being prepared for dispatch.', 'OrderMe Fulfillment Center')
      `).run(orderId);

      db.exec('COMMIT');

      const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        data: {
          ...createdOrder,
          items: orderItems
        }
      });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place order. Please try again.'
    });
  }
}

// GET /api/orders
function getUserOrders(req, res) {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(req.user.id);

    const fullOrders = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        ...order,
        items
      };
    });

    res.json({
      success: true,
      data: fullOrders
    });
  } catch (error) {
    console.error('getUserOrders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders.'
    });
  }
}

// GET /api/orders/:id
function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;

    let order;
    if (isNaN(id)) {
      order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(id);
    } else {
      order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(id, id);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (userRole !== 'admin' && userId && order.user_id && order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const tracking = db.prepare('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY id ASC').all(order.id);

    res.json({
      success: true,
      data: {
        ...order,
        items,
        tracking
      }
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details.'
    });
  }
}

// GET /api/orders/track/:identifier (public tracking)
function trackOrder(req, res) {
  try {
    const { identifier } = req.params;
    const term = identifier.trim();

    let order;
    if (term.startsWith('ORD-')) {
      order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(term);
    } else if (!isNaN(term)) {
      order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(term, term);
    } else {
      order = db.prepare('SELECT * FROM orders WHERE order_number LIKE ? OR customer_phone = ?').get(`%${term}%`, term);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No order found with reference "${identifier}". Please verify your Order ID.`
      });
    }

    const items = db.prepare('SELECT product_title, price, quantity, image FROM order_items WHERE order_id = ?').all(order.id);
    let tracking = db.prepare('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY id ASC').all(order.id);

    const allStatuses = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const isCancelled = order.status === 'Cancelled';
    const currentStatusIndex = isCancelled ? -1 : allStatuses.indexOf(order.status);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        isCancelled,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        customerName: order.customer_name,
        shippingAddress: `${order.shipping_address}, ${order.shipping_city} - ${order.shipping_pincode}`,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        items,
        trackingHistory: tracking,
        progressIndex: currentStatusIndex >= 0 ? currentStatusIndex : 0,
        stages: allStatuses
      }
    });
  } catch (error) {
    console.error('trackOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track order.'
    });
  }
}

// PUT /api/orders/:id/cancel
function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(id, id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (userRole !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order.' });
    }

    if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status) && userRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled once it is ${order.status.toLowerCase()}. Please contact customer support.`
      });
    }

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare(`UPDATE orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(order.id);

      // Restore product stock
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
      for (const item of items) {
        if (item.product_id) {
          db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
        }
      }

      // Add tracking event
      db.prepare(`
        INSERT INTO order_tracking (order_id, status, title, description, location)
        VALUES (?, 'Cancelled', 'Order Cancelled', 'The order has been cancelled and any payment will be refunded.', 'Order Processing Center')
      `).run(order.id);

      db.exec('COMMIT');

      res.json({
        success: true,
        message: 'Order has been cancelled successfully.'
      });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('cancelOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order.'
    });
  }
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  trackOrder,
  cancelOrder
};
