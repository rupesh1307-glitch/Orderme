const { db } = require('../config/db');

// GET /api/admin/stats
function getStats(req, res) {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'Completed' OR status != 'Cancelled'`).get().total;
    const totalCustomers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'customer'`).get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= 10').get().count;

    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `).all();

    const recentOrders = db.prepare(`
      SELECT id, order_number, customer_name, total_amount, status, payment_method, payment_status, created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 6
    `).all();

    const salesByCategory = db.prepare(`
      SELECT c.name, COUNT(oi.id) as units_sold, COALESCE(SUM(oi.subtotal), 0) as revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY c.id
    `).all();

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        totalCustomers,
        totalProducts,
        lowStockCount,
        ordersByStatus,
        recentOrders,
        salesByCategory
      }
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats.'
    });
  }
}

// GET /api/admin/orders
function getAllOrders(req, res) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = `SELECT * FROM orders WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY id DESC`;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const orders = db.prepare(query).all(...params);

    const fullOrders = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        ...order,
        items
      };
    });

    res.json({
      success: true,
      data: fullOrders,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('getAllOrders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders.'
    });
  }
}

// PUT /api/admin/orders/:id/status
function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, description, location } = req.body;

    const validStatuses = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(id, id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const defaultDescriptions = {
      'Placed': 'Order placed by customer.',
      'Confirmed': 'Order verified and confirmed by warehouse.',
      'Shipped': 'Package shipped via express delivery service.',
      'Out for Delivery': 'Package is out for delivery with our delivery partner.',
      'Delivered': 'Package delivered to customer successfully.',
      'Cancelled': 'Order has been cancelled.'
    };

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare(`
        UPDATE orders
        SET status = ?,
            payment_status = CASE WHEN ? = 'Delivered' AND payment_method = 'cod' THEN 'Completed' ELSE payment_status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, status, order.id);

      db.prepare(`
        INSERT INTO order_tracking (order_id, status, title, description, location)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        order.id,
        status,
        `Status Updated to ${status}`,
        description || defaultDescriptions[status] || `Order status updated to ${status}`,
        location || 'OrderMe Logistics Hub'
      );

      db.exec('COMMIT');

      res.json({
        success: true,
        message: `Order #${order.order_number} status updated to "${status}".`
      });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status.'
    });
  }
}

// POST /api/admin/products
function createProduct(req, res) {
  try {
    const { title, description, price, original_price, category_id, stock = 50, image, is_featured = 0 } = req.body;

    if (!title || !price || !category_id || !image) {
      return res.status(400).json({
        success: false,
        message: 'Title, price, category, and image URL are required.'
      });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = db.prepare(`
      INSERT INTO products (title, slug, description, price, original_price, category_id, stock, image, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      slug,
      description || '',
      Number(price),
      original_price ? Number(original_price) : null,
      Number(category_id),
      Number(stock),
      image.trim(),
      is_featured ? 1 : 0
    );

    const newProduct = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      data: newProduct
    });
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product.'
    });
  }
}

// PUT /api/admin/products/:id
function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { title, description, price, original_price, category_id, stock, image, is_featured } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.prepare(`
      UPDATE products
      SET title = ?,
          description = ?,
          price = ?,
          original_price = ?,
          category_id = ?,
          stock = ?,
          image = ?,
          is_featured = ?
      WHERE id = ?
    `).run(
      title ? title.trim() : existing.title,
      description !== undefined ? description : existing.description,
      price !== undefined ? Number(price) : existing.price,
      original_price !== undefined ? Number(original_price) : existing.original_price,
      category_id !== undefined ? Number(category_id) : existing.category_id,
      stock !== undefined ? Number(stock) : existing.stock,
      image !== undefined ? image.trim() : existing.image,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      id
    );

    const updated = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);

    res.json({
      success: true,
      message: 'Product updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product.'
    });
  }
}

// DELETE /api/admin/products/:id
function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, title FROM products WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    res.json({
      success: true,
      message: `Product "${existing.title}" deleted successfully.`
    });
  } catch (error) {
    console.error('deleteProduct error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product.'
    });
  }
}

module.exports = {
  getStats,
  getAllOrders,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct
};
