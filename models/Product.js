/**
 * models/Product.js
 * 
 * Sample Product Data Model definition, validation schema, 
 * and database access methods.
 */

const { db } = require('../config/db');

class Product {
  /**
   * Sample Product Schema / Data Model Object:
   * 
   * {
   *   id: 1,                                       // INTEGER PRIMARY KEY
   *   title: "Sony WH-1000XM5 Headphones",         // String (Required)
   *   slug: "sony-wh-1000xm5-headphones",          // String (URL identifier)
   *   brand: "Sony",                               // String (Manufacturer/Brand)
   *   sku: "SNY-HD-XM5-BLK",                       // String (Stock Keeping Unit)
   *   description: "Industry-leading noise...",    // String (Full text)
   *   price: 26990.00,                             // Number/Float (Selling price in INR)
   *   original_price: 34990.00,                    // Number/Float (MRP / discount baseline)
   *   category_id: 2,                              // Number (Foreign Key to categories.id)
   *   category_name: "Electronics",                // String (Joined from categories)
   *   stock: 40,                                   // Number (Available inventory units)
   *   rating: 4.9,                                 // Number (Average 1.0 - 5.0)
   *   review_count: 310,                           // Number (Total reviews submitted)
   *   image: "https://images.unsplash.com/...",    // String (Primary thumbnail URL)
   *   images: [                                    // Array of Strings (Gallery images)
   *     "https://images.unsplash.com/...-1",
   *     "https://images.unsplash.com/...-2"
   *   ],
   *   specifications: {                            // Key-Value Object (Specs)
   *     "Connectivity": "Bluetooth 5.2, 3.5mm Jack",
   *     "Battery Life": "30 hours",
   *     "Noise Cancellation": "Active (Dual processor)"
   *   },
   *   variants: [                                  // Array of product variations
   *     { color: "Black", sku: "SNY-HD-XM5-BLK", stock: 25 },
   *     { color: "Silver", sku: "SNY-HD-XM5-SLV", stock: 15 }
   *   ],
   *   is_featured: 1,                              // Boolean (0 or 1)
   *   is_active: 1,                                // Boolean (0 or 1, soft deletion)
   *   created_at: "2026-09-07T12:00:00.000Z",      // ISO Datetime
   *   updated_at: "2026-09-07T12:00:00.000Z"       // ISO Datetime
   * }
   */

  /**
   * Find product by ID
   * @param {number|string} id 
   * @returns {object|null}
   */
  static findById(id) {
    return db.prepare(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
  }

  /**
   * Find product by slug
   * @param {string} slug 
   * @returns {object|null}
   */
  static findBySlug(slug) {
    return db.prepare(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `).get(slug);
  }

  /**
   * Find all products with optional filters
   * @param {object} filters 
   * @returns {Array}
   */
  static findAll({ categoryId, isFeatured, searchQuery, minPrice, maxPrice, limit = 50, offset = 0 } = {}) {
    let query = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(categoryId);
    }
    if (isFeatured !== undefined) {
      query += ` AND p.is_featured = ?`;
      params.push(isFeatured ? 1 : 0);
    }
    if (searchQuery) {
      query += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
      const term = `%${searchQuery}%`;
      params.push(term, term);
    }
    if (minPrice !== undefined) {
      query += ` AND p.price >= ?`;
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      query += ` AND p.price <= ?`;
      params.push(maxPrice);
    }

    query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  /**
   * Create a new product
   * @param {object} productData 
   * @returns {object} created product
   */
  static create({ title, description, price, original_price, category_id, stock = 50, image, is_featured = 0 }) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = db.prepare(`
      INSERT INTO products (title, slug, description, price, original_price, category_id, stock, image, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, slug, description, price, original_price || null, category_id, stock, image, is_featured ? 1 : 0);

    return this.findById(res.lastInsertRowid);
  }

  /**
   * Update product stock
   * @param {number} id 
   * @param {number} quantityChange (negative to reduce, positive to add)
   */
  static adjustStock(id, quantityChange) {
    db.prepare(`
      UPDATE products 
      SET stock = stock + ? 
      WHERE id = ? AND (stock + ?) >= 0
    `).run(quantityChange, id, quantityChange);
  }
}

module.exports = Product;
