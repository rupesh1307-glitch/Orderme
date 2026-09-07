const { db } = require('../config/db');

// GET /api/products
function getProducts(req, res) {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      featured,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    let query = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      query += ` AND (p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ?)`;
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'all') {
      if (isNaN(category)) {
        query += ` AND c.slug = ?`;
        params.push(category.toLowerCase());
      } else {
        query += ` AND p.category_id = ?`;
        params.push(Number(category));
      }
    }

    if (minPrice && !isNaN(minPrice)) {
      query += ` AND p.price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice && !isNaN(maxPrice)) {
      query += ` AND p.price <= ?`;
      params.push(Number(maxPrice));
    }

    if (featured === 'true' || featured === '1') {
      query += ` AND p.is_featured = 1`;
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY p.price DESC`;
        break;
      case 'rating_desc':
        query += ` ORDER BY p.rating DESC, p.review_count DESC`;
        break;
      case 'title_asc':
        query += ` ORDER BY p.title ASC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY p.id DESC`;
        break;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    // Construct count query
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const products = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: products,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products.'
    });
  }
}

// GET /api/products/:id
function getProductById(req, res) {
  try {
    const { id } = req.params;

    const product = db.prepare(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? OR p.slug = ?
    `).get(id, id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Get reviews
    const reviews = db.prepare(`
      SELECT id, user_name, rating, comment, created_at
      FROM reviews
      WHERE product_id = ?
      ORDER BY created_at DESC
    `).all(product.id);

    // Get related products from same category
    const related = db.prepare(`
      SELECT p.*, c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ?
      LIMIT 4
    `).all(product.category_id, product.id);

    res.json({
      success: true,
      data: {
        ...product,
        reviews,
        related
      }
    });
  } catch (error) {
    console.error('getProductById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product details.'
    });
  }
}

// GET /api/categories
function getCategories(req, res) {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `).all();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories.'
    });
  }
}

// POST /api/products/:id/reviews
function addProductReview(req, res) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Valid rating between 1 and 5 is required.'
      });
    }

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.prepare(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(product.id, userId, userName, rating, comment || '');

    // Recompute product average rating
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews WHERE product_id = ?
    `).get(product.id);

    db.prepare(`
      UPDATE products
      SET rating = ?, review_count = ?
      WHERE id = ?
    `).run(Number(stats.avg_rating.toFixed(1)), stats.count, product.id);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!'
    });
  } catch (error) {
    console.error('addProductReview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review.'
    });
  }
}

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  addProductReview
};
