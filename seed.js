const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./db');

function seedDatabase() {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('Database already contains data. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding database with initial data...');

  // 1. Create Default Users (Admin & Customer)
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const customerPasswordHash = bcrypt.hashSync('password123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, address, city, pincode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminResult = insertUser.run(
    'OrderMe Admin',
    'admin@orderme.com',
    adminPasswordHash,
    'admin',
    '9876543210',
    '123 Admin Plaza, Tech Park',
    'Bangalore',
    '560001'
  );

  const customerResult = insertUser.run(
    'Rupesh Kumar',
    'user@orderme.com',
    customerPasswordHash,
    'customer',
    '9123456780',
    'Flat 402, Sunshine Heights, MG Road',
    'Mumbai',
    '400001'
  );

  const adminId = adminResult.lastInsertRowid;
  const customerId = customerResult.lastInsertRowid;

  // 2. Create Categories
  const categories = [
    { name: 'Mobiles', slug: 'mobiles', icon: '📱', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60' },
    { name: 'Electronics', slug: 'electronics', icon: '💻', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60' },
    { name: 'Fashion', slug: 'fashion', icon: '👕', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop&q=60' },
    { name: 'Grocery', slug: 'grocery', icon: '🛒', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60' }
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, icon, image)
    VALUES (?, ?, ?, ?)
  `);

  const categoryMap = {};
  for (const cat of categories) {
    const res = insertCategory.run(cat.name, cat.slug, cat.icon, cat.image);
    categoryMap[cat.name] = res.lastInsertRowid;
  }

  // 3. Create Rich Products
  const products = [
    // Mobiles
    {
      title: 'iPhone 15 Pro Max (256 GB) - Titanium Blue',
      slug: 'iphone-15-pro-max-256gb',
      description: 'Forged in titanium with industry-leading A17 Pro chip, customizable Action button, 48MP camera system, and USB-C.',
      price: 134900,
      original_price: 159900,
      category: 'Mobiles',
      stock: 25,
      rating: 4.9,
      review_count: 142,
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray)',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Galaxy AI is here. 200MP camera, Snapdragon 8 Gen 3 processor, S Pen included, and 5000mAh all-day battery.',
      price: 129999,
      original_price: 144999,
      category: 'Mobiles',
      stock: 18,
      rating: 4.8,
      review_count: 98,
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'OnePlus 12 (Emerald Green, 16GB RAM)',
      slug: 'oneplus-12-emerald-green',
      description: 'Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, 2K 120Hz ProXDR Display with 100W SUPERVOOC charging.',
      price: 64999,
      original_price: 69999,
      category: 'Mobiles',
      stock: 30,
      rating: 4.7,
      review_count: 76,
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
      is_featured: 0
    },

    // Electronics
    {
      title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm5-headphones',
      description: 'Industry-leading noise cancellation with 2 processors and 8 microphones. Ultra-comfortable lightweight design and 30-hr battery.',
      price: 26990,
      original_price: 34990,
      category: 'Electronics',
      stock: 40,
      rating: 4.9,
      review_count: 310,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'Apple Watch Series 9 (GPS 45mm) - Midnight Aluminum',
      slug: 'apple-watch-series-9-45mm',
      description: 'S9 SiP chip, Double tap gesture, brighter display, advanced health sensors with Blood Oxygen and ECG monitor.',
      price: 41900,
      original_price: 44900,
      category: 'Electronics',
      stock: 22,
      rating: 4.8,
      review_count: 89,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'Keychron K2 Wireless Mechanical Keyboard (RGB Backlit)',
      slug: 'keychron-k2-mechanical-keyboard',
      description: '75% compact layout, Gateron G Pro mechanical switches, Mac and Windows compatibility, Bluetooth 5.1 & Type-C wired.',
      price: 7499,
      original_price: 8999,
      category: 'Electronics',
      stock: 35,
      rating: 4.7,
      review_count: 64,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'Logitech MX Master 3S Wireless Performance Mouse',
      slug: 'logitech-mx-master-3s',
      description: 'Quiet clicks, 8K DPI any-surface tracking, MagSpeed electromagnetic scrolling, USB-C fast charging.',
      price: 8995,
      original_price: 10995,
      category: 'Electronics',
      stock: 50,
      rating: 4.9,
      review_count: 215,
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
      is_featured: 0
    },

    // Fashion
    {
      title: 'Men\'s Classic Tailored Linen Blazer - Navy Blue',
      slug: 'mens-classic-linen-blazer',
      description: 'Premium breathable Italian linen fabric, slim fit cut, notch lapel, double rear vents for sharp casual and formal wear.',
      price: 3499,
      original_price: 5999,
      category: 'Fashion',
      stock: 45,
      rating: 4.6,
      review_count: 53,
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'Nike Air Max 270 React Running Sneakers',
      slug: 'nike-air-max-270-react',
      description: 'Max Air 270 unit delivers unrivaled, all-day comfort. Nike React technology provides an extremely smooth ride.',
      price: 11495,
      original_price: 13995,
      category: 'Fashion',
      stock: 30,
      rating: 4.8,
      review_count: 172,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'Classic Aviator Polarized Sunglasses (UV400 Protection)',
      slug: 'classic-aviator-polarized-sunglasses',
      description: 'Timeless gold frame with green polarized lenses, anti-glare scratch resistant coating, leather travel case included.',
      price: 1899,
      original_price: 3499,
      category: 'Fashion',
      stock: 60,
      rating: 4.5,
      review_count: 41,
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
      is_featured: 0
    },

    // Grocery
    {
      title: 'Premium Royal Organic California Almonds (1kg)',
      slug: 'premium-royal-organic-almonds-1kg',
      description: '100% natural, vacuum packed crunchy California almonds. Rich in Vitamin E, antioxidants, and dietary fiber.',
      price: 899,
      original_price: 1200,
      category: 'Grocery',
      stock: 120,
      rating: 4.9,
      review_count: 420,
      image: 'https://images.unsplash.com/photo-1508061252445-b95013cb7c5b?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'Single Origin Arabica Whole Coffee Beans (500g)',
      slug: 'single-origin-arabica-coffee-beans',
      description: 'Freshly roasted medium roast with notes of dark chocolate and hazelnut. Ideal for espresso, French press, and pour over.',
      price: 649,
      original_price: 850,
      category: 'Grocery',
      stock: 75,
      rating: 4.7,
      review_count: 88,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
      is_featured: 0
    },
    {
      title: 'Pure Organic Raw Himalayan Honey (500g Glass Jar)',
      slug: 'pure-organic-raw-himalayan-honey',
      description: 'Unprocessed, unfiltered natural forest honey harvested from high altitude Himalayan ranges. Rich in natural enzymes.',
      price: 499,
      original_price: 699,
      category: 'Grocery',
      stock: 90,
      rating: 4.8,
      review_count: 115,
      image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
      is_featured: 0
    },

    // Home & Kitchen
    {
      title: 'Philips Digital Air Fryer with Rapid Air Technology (4.1L)',
      slug: 'philips-digital-air-fryer-4-1l',
      description: 'Fry with up to 90% less fat. Touch screen with 7 presets, keep warm function, easy clean basket.',
      price: 7999,
      original_price: 11995,
      category: 'Home & Kitchen',
      stock: 35,
      rating: 4.8,
      review_count: 240,
      image: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&auto=format&fit=crop&q=80',
      is_featured: 1
    },
    {
      title: 'Nespresso Vertuo Next Espresso Coffee Machine',
      slug: 'nespresso-vertuo-next-espresso-machine',
      description: 'Centrifusion technology brews authentic espresso with rich crema. 5 cup sizes, one-touch brewing system.',
      price: 16999,
      original_price: 21999,
      category: 'Home & Kitchen',
      stock: 20,
      rating: 4.7,
      review_count: 67,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80',
      is_featured: 0
    },
    {
      title: 'Smart Ceramic Aroma Diffuser & Humidifier (500ml)',
      slug: 'smart-ceramic-aroma-diffuser-500ml',
      description: 'Ultrasonic whisper-quiet mist with 7 soothing LED ambient colors, auto shut-off, and timer settings.',
      price: 1499,
      original_price: 2499,
      category: 'Home & Kitchen',
      stock: 65,
      rating: 4.6,
      review_count: 94,
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80',
      is_featured: 0
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (title, slug, description, price, original_price, category_id, stock, rating, review_count, image, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertedProductIds = [];
  for (const prod of products) {
    const categoryId = categoryMap[prod.category];
    const res = insertProduct.run(
      prod.title,
      prod.slug,
      prod.description,
      prod.price,
      prod.original_price,
      categoryId,
      prod.stock,
      prod.rating,
      prod.review_count,
      prod.image,
      prod.is_featured
    );
    insertedProductIds.push(res.lastInsertRowid);
  }

  // 4. Create Sample Order with Live Tracking Timeline
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, user_id, customer_name, customer_email, customer_phone,
      shipping_address, shipping_city, shipping_pincode, subtotal, shipping_fee, tax,
      total_amount, status, payment_method, payment_status, transaction_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleOrderRes = insertOrder.run(
    'ORD-' + (Date.now() - 86400000).toString().slice(-8),
    customerId,
    'Rupesh Kumar',
    'user@orderme.com',
    '9123456780',
    'Flat 402, Sunshine Heights, MG Road',
    'Mumbai',
    '400001',
    27889,
    0,
    0,
    27889,
    'Shipped',
    'card',
    'Completed',
    'TXN_987412356'
  );

  const sampleOrderId = sampleOrderRes.lastInsertRowid;

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_title, price, quantity, subtotal, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrderItem.run(
    sampleOrderId,
    insertedProductIds[3], // Sony Headphones
    'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    26990,
    1,
    26990,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
  );

  insertOrderItem.run(
    sampleOrderId,
    insertedProductIds[10], // Almonds
    'Premium Royal Organic California Almonds (1kg)',
    899,
    1,
    899,
    'https://images.unsplash.com/photo-1508061252445-b95013cb7c5b?w=600&auto=format&fit=crop&q=80'
  );

  const insertTracking = db.prepare(`
    INSERT INTO order_tracking (order_id, status, title, description, location, event_time)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertTracking.run(sampleOrderId, 'Placed', 'Order Placed', 'Your order has been placed and received by OrderMe.', 'Order Center', '-2 days');
  insertTracking.run(sampleOrderId, 'Confirmed', 'Order Confirmed', 'Seller has processed your order and packed the package.', 'Fulfillment Warehouse, Mumbai', '-1 days');
  insertTracking.run(sampleOrderId, 'Shipped', 'Shipped with Express Logistics', 'Package in transit with BlueDart Express (Tracking #BD784920).', 'Central Hub, Mumbai', '-5 hours');

  console.log('✅ Database seeded successfully with users, categories, products, and sample orders!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
