const { db } = require('../config/db');

// Helper to format cart response
function getUserCartData(userId) {
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.product_id,
           p.title, p.price, p.original_price, p.image, p.stock,
           (ci.quantity * p.price) AS subtotal
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
    ORDER BY ci.id DESC
  `).all(userId);

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    totalItems,
    totalAmount
  };
}

// GET /api/cart
function getCart(req, res) {
  try {
    const cart = getUserCartData(req.user.id);
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('getCart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart.'
    });
  }
}

// POST /api/cart/add
function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = db.prepare('SELECT id, title, price, stock FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`
      });
    }

    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId);

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Maximum available stock is ${product.stock}.`
        });
      }
      db.prepare(`
        UPDATE cart_items
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newQty, existing.id);
    } else {
      db.prepare(`
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `).run(userId, productId, qty);
    }

    const updatedCart = getUserCartData(userId);
    res.json({
      success: true,
      message: `"${product.title}" added to cart!`,
      data: updatedCart
    });
  } catch (error) {
    console.error('addToCart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart.'
    });
  }
}

// PUT /api/cart/items/:productId
function updateCartItem(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity.' });
    }

    if (qty === 0) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(userId, productId);
    } else {
      const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
      if (product && qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot exceed available stock of ${product.stock}.`
        });
      }

      db.prepare(`
        UPDATE cart_items
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND product_id = ?
      `).run(qty, userId, productId);
    }

    const updatedCart = getUserCartData(userId);
    res.json({
      success: true,
      message: 'Cart updated.',
      data: updatedCart
    });
  } catch (error) {
    console.error('updateCartItem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart.'
    });
  }
}

// DELETE /api/cart/items/:productId
function removeFromCart(req, res) {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(userId, productId);

    const updatedCart = getUserCartData(userId);
    res.json({
      success: true,
      message: 'Item removed from cart.',
      data: updatedCart
    });
  } catch (error) {
    console.error('removeFromCart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item.'
    });
  }
}

// DELETE /api/cart/clear
function clearCart(req, res) {
  try {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    res.json({
      success: true,
      message: 'Cart cleared.',
      data: { items: [], totalItems: 0, totalAmount: 0 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart.'
    });
  }
}

// POST /api/cart/sync
function syncCart(req, res) {
  try {
    const { localItems = [] } = req.body;
    const userId = req.user.id;

    if (Array.isArray(localItems) && localItems.length > 0) {
      for (const item of localItems) {
        const prodId = item.id || item.productId;
        const qty = item.qty || item.quantity || 1;
        if (!prodId) continue;

        const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(prodId);
        if (!product) continue;

        const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, prodId);
        if (existing) {
          const combined = Math.min(product.stock, existing.quantity + qty);
          db.prepare('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(combined, existing.id);
        } else {
          db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, prodId, Math.min(product.stock, qty));
        }
      }
    }

    const updatedCart = getUserCartData(userId);
    res.json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('syncCart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync cart.'
    });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart
};
