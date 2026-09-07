// api.js - OrderMe Unified REST API Client & Session Manager
(function(window) {
  // Automatically connect to backend server on port 5000 even if opened via file:/// protocol
  const API_BASE = (window.location.protocol === 'file:' || window.location.port !== '5000')
    ? 'http://localhost:5000'
    : '';

  const TOKEN_KEY = 'orderme_jwt_token';
  const USER_KEY = 'orderme_user_profile';
  const CART_KEY = 'orderme_cart';

  // Fallback catalog for instant offline / client preview
  const FALLBACK_CATEGORIES = [
    { id: 1, name: 'Mobiles', slug: 'mobiles', icon: '📱', product_count: 3 },
    { id: 2, name: 'Electronics', slug: 'electronics', icon: '💻', product_count: 4 },
    { id: 3, name: 'Fashion', slug: 'fashion', icon: '👕', product_count: 3 },
    { id: 4, name: 'Grocery', slug: 'grocery', icon: '🛒', product_count: 3 },
    { id: 5, name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠', product_count: 3 }
  ];

  const FALLBACK_PRODUCTS = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max (256 GB) - Titanium Blue',
      slug: 'iphone-15-pro-max-256gb',
      category_id: 1,
      category_name: 'Mobiles',
      category_slug: 'mobiles',
      price: 134900,
      original_price: 159900,
      stock: 25,
      rating: 4.9,
      review_count: 142,
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
      description: 'Forged in titanium with industry-leading A17 Pro chip, customizable Action button, and 48MP camera system.',
      is_featured: 1
    },
    {
      id: 2,
      title: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray)',
      slug: 'samsung-galaxy-s24-ultra',
      category_id: 1,
      category_name: 'Mobiles',
      category_slug: 'mobiles',
      price: 129999,
      original_price: 144999,
      stock: 18,
      rating: 4.8,
      review_count: 98,
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
      description: 'Galaxy AI is here. 200MP camera, Snapdragon 8 Gen 3 processor, and S Pen included.',
      is_featured: 1
    },
    {
      id: 3,
      title: 'OnePlus 12 (Emerald Green, 16GB RAM)',
      slug: 'oneplus-12-emerald-green',
      category_id: 1,
      category_name: 'Mobiles',
      category_slug: 'mobiles',
      price: 64999,
      original_price: 69999,
      stock: 30,
      rating: 4.7,
      review_count: 76,
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
      description: 'Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, 2K 120Hz ProXDR Display.',
      is_featured: 0
    },
    {
      id: 4,
      title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm5-headphones',
      category_id: 2,
      category_name: 'Electronics',
      category_slug: 'electronics',
      price: 26990,
      original_price: 34990,
      stock: 40,
      rating: 4.9,
      review_count: 310,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      description: 'Industry-leading noise cancellation with 2 processors and 8 microphones. 30-hour battery life.',
      is_featured: 1
    },
    {
      id: 5,
      title: 'Apple Watch Series 9 (GPS 45mm) - Midnight Aluminum',
      slug: 'apple-watch-series-9-45mm',
      category_id: 2,
      category_name: 'Electronics',
      category_slug: 'electronics',
      price: 41900,
      original_price: 44900,
      stock: 22,
      rating: 4.8,
      review_count: 89,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      description: 'S9 SiP chip, Double tap gesture, brighter display, advanced health sensors.',
      is_featured: 1
    },
    {
      id: 6,
      title: 'Keychron K2 Wireless Mechanical Keyboard (RGB Backlit)',
      slug: 'keychron-k2-mechanical-keyboard',
      category_id: 2,
      category_name: 'Electronics',
      category_slug: 'electronics',
      price: 7499,
      original_price: 8999,
      stock: 35,
      rating: 4.7,
      review_count: 64,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      description: '75% compact layout, Gateron G Pro mechanical switches, Mac & Windows compatible.',
      is_featured: 1
    },
    {
      id: 7,
      title: 'Logitech MX Master 3S Wireless Mouse',
      slug: 'logitech-mx-master-3s',
      category_id: 2,
      category_name: 'Electronics',
      category_slug: 'electronics',
      price: 8995,
      original_price: 10995,
      stock: 50,
      rating: 4.9,
      review_count: 215,
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
      description: 'Quiet clicks, 8K DPI any-surface tracking, MagSpeed electromagnetic scrolling.',
      is_featured: 0
    },
    {
      id: 8,
      title: "Men's Classic Tailored Linen Blazer - Navy Blue",
      slug: 'mens-classic-linen-blazer',
      category_id: 3,
      category_name: 'Fashion',
      category_slug: 'fashion',
      price: 3499,
      original_price: 5999,
      stock: 45,
      rating: 4.6,
      review_count: 53,
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
      description: 'Premium breathable Italian linen fabric, slim fit cut, notch lapel.',
      is_featured: 1
    },
    {
      id: 9,
      title: 'Nike Air Max 270 React Running Sneakers',
      slug: 'nike-air-max-270-react',
      category_id: 3,
      category_name: 'Fashion',
      category_slug: 'fashion',
      price: 11495,
      original_price: 13995,
      stock: 30,
      rating: 4.8,
      review_count: 172,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      description: 'Max Air 270 unit delivers all-day comfort with Nike React cushioning.',
      is_featured: 1
    },
    {
      id: 10,
      title: 'Classic Aviator Polarized Sunglasses',
      slug: 'classic-aviator-polarized-sunglasses',
      category_id: 3,
      category_name: 'Fashion',
      category_slug: 'fashion',
      price: 1899,
      original_price: 3499,
      stock: 60,
      rating: 4.5,
      review_count: 41,
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
      description: 'Gold frame with polarized green lenses, UV400 protection.',
      is_featured: 0
    },
    {
      id: 11,
      title: 'Premium Royal Organic California Almonds (1kg)',
      slug: 'premium-royal-organic-almonds-1kg',
      category_id: 4,
      category_name: 'Grocery',
      category_slug: 'grocery',
      price: 899,
      original_price: 1200,
      stock: 120,
      rating: 4.9,
      review_count: 420,
      image: 'https://images.unsplash.com/photo-1508061252445-b95013cb7c5b?w=600&auto=format&fit=crop&q=80',
      description: '100% natural, vacuum packed crunchy California almonds.',
      is_featured: 1
    },
    {
      id: 12,
      title: 'Single Origin Arabica Coffee Beans (500g)',
      slug: 'single-origin-arabica-coffee-beans',
      category_id: 4,
      category_name: 'Grocery',
      category_slug: 'grocery',
      price: 649,
      original_price: 850,
      stock: 75,
      rating: 4.7,
      review_count: 88,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
      description: 'Freshly roasted medium roast with notes of dark chocolate and hazelnut.',
      is_featured: 0
    },
    {
      id: 13,
      title: 'Pure Organic Raw Himalayan Honey (500g)',
      slug: 'pure-organic-raw-himalayan-honey',
      category_id: 4,
      category_name: 'Grocery',
      category_slug: 'grocery',
      price: 499,
      original_price: 699,
      stock: 90,
      rating: 4.8,
      review_count: 115,
      image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
      description: 'Unprocessed natural honey harvested from high altitude Himalayan ranges.',
      is_featured: 0
    },
    {
      id: 14,
      title: 'Philips Digital Air Fryer Rapid Air (4.1L)',
      slug: 'philips-digital-air-fryer-4-1l',
      category_id: 5,
      category_name: 'Home & Kitchen',
      category_slug: 'home-kitchen',
      price: 7999,
      original_price: 11995,
      stock: 35,
      rating: 4.8,
      review_count: 240,
      image: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&auto=format&fit=crop&q=80',
      description: 'Fry with up to 90% less fat. Touch screen with 7 presets.',
      is_featured: 1
    },
    {
      id: 15,
      title: 'Nespresso Vertuo Next Coffee Machine',
      slug: 'nespresso-vertuo-next-espresso-machine',
      category_id: 5,
      category_name: 'Home & Kitchen',
      category_slug: 'home-kitchen',
      price: 16999,
      original_price: 21999,
      stock: 20,
      rating: 4.7,
      review_count: 67,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80',
      description: 'Centrifusion technology brews authentic espresso with rich crema.',
      is_featured: 0
    },
    {
      id: 16,
      title: 'Smart Ceramic Aroma Diffuser & Humidifier',
      slug: 'smart-ceramic-aroma-diffuser-500ml',
      category_id: 5,
      category_name: 'Home & Kitchen',
      category_slug: 'home-kitchen',
      price: 1499,
      original_price: 2499,
      stock: 65,
      rating: 4.6,
      review_count: 94,
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80',
      description: 'Ultrasonic whisper-quiet mist with 7 soothing ambient colors.',
      is_featured: 0
    }
  ];

  // ---------------- AUTHENTICATION & STORAGE ----------------
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  function getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function setAuth(user, token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    updateCartCount();
    setupNavbar();
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CART_KEY);
    if (window.Toast) {
      window.Toast.info('You have logged out.');
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 600);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
  }

  // ---------------- CORE REQUEST HELPER ----------------
  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({ success: false, message: 'Server error' }));

      if (!res.ok) {
        if (res.status === 401 && isLoggedIn()) {
          // Token expired
          console.warn('Session expired. Logging out.');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (window.Toast) window.Toast.error('Session expired. Please log in again.');
          setTimeout(() => { window.location.href = 'login.html'; }, 1000);
        }
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ---------------- AUTH APIS ----------------
  async function register(userData) {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: userData
    });
    if (res.success && res.token) {
      setAuth(res.user, res.token);
      await syncLocalCart();
    }
    return res;
  }

  async function login(email, password) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (res.success && res.token) {
      setAuth(res.user, res.token);
      await syncLocalCart();
    }
    return res;
  }

  async function getProfile() {
    const res = await request('/api/auth/me');
    if (res.success && res.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  }

  async function updateProfile(data) {
    const res = await request('/api/auth/profile', {
      method: 'PUT',
      body: data
    });
    if (res.success && res.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  }

  // ---------------- PRODUCT APIS ----------------
  async function getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';

    try {
      return await request(`/api/products${qs}`);
    } catch (err) {
      console.warn('Backend unavailable, serving fallback products catalog:', err.message);
      let list = [...FALLBACK_PRODUCTS];

      if (params.category && params.category !== 'all') {
        list = list.filter(p => p.category_slug === params.category || String(p.category_id) === String(params.category));
      }
      if (params.q) {
        const q = params.q.toLowerCase();
        list = list.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q));
      }
      if (params.featured === 'true' || params.featured === '1') {
        list = list.filter(p => p.is_featured);
      }
      if (params.sort === 'price_asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (params.sort === 'price_desc') {
        list.sort((a, b) => b.price - a.price);
      } else if (params.sort === 'rating_desc') {
        list.sort((a, b) => b.rating - a.rating);
      } else if (params.sort === 'title_asc') {
        list.sort((a, b) => a.title.localeCompare(b.title));
      }

      return {
        success: true,
        data: list,
        pagination: { total: list.length, page: 1, limit: 50, totalPages: 1 }
      };
    }
  }

  async function getCategories() {
    try {
      return await request('/api/categories');
    } catch (err) {
      console.warn('Backend unavailable, serving fallback categories:', err.message);
      return {
        success: true,
        data: FALLBACK_CATEGORIES
      };
    }
  }

  async function getProductById(id) {
    try {
      return await request(`/api/products/${id}`);
    } catch (err) {
      const prod = FALLBACK_PRODUCTS.find(p => p.id == id || p.slug === id);
      if (prod) {
        return { success: true, data: prod };
      }
      throw err;
    }
  }

  async function addProductReview(productId, rating, comment) {
    return await request(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: { rating, comment }
    });
  }

  // ---------------- CART APIS ----------------
  function getLocalCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  async function getCart() {
    if (isLoggedIn()) {
      try {
        const res = await request('/api/cart');
        return res.data;
      } catch (e) {
        return { items: getLocalCart(), totalItems: 0, totalAmount: 0 };
      }
    } else {
      const local = getLocalCart();
      const totalAmount = local.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const totalItems = local.reduce((sum, item) => sum + item.qty, 0);
      return {
        items: local.map(i => ({
          ...i,
          product_id: i.id,
          quantity: i.qty,
          subtotal: i.price * i.qty
        })),
        totalItems,
        totalAmount
      };
    }
  }

  async function addToCart(product, quantity = 1) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const prodId = product.id;

    if (isLoggedIn()) {
      const res = await request('/api/cart/add', {
        method: 'POST',
        body: { productId: prodId, quantity: qty }
      });
      updateCartCount();
      return res;
    } else {
      const cart = getLocalCart();
      const existing = cart.find(item => item.id == prodId);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({
          id: prodId,
          title: product.title || product.name,
          price: product.price,
          image: product.image || product.img,
          qty: qty
        });
      }
      saveLocalCart(cart);
      updateCartCount();
      return {
        success: true,
        message: `"${product.title || product.name}" added to cart!`
      };
    }
  }

  async function updateCartItem(productId, quantity) {
    if (isLoggedIn()) {
      const res = await request(`/api/cart/items/${productId}`, {
        method: 'PUT',
        body: { quantity }
      });
      updateCartCount();
      return res;
    } else {
      let cart = getLocalCart();
      if (quantity <= 0) {
        cart = cart.filter(i => i.id != productId);
      } else {
        const item = cart.find(i => i.id == productId);
        if (item) item.qty = quantity;
      }
      saveLocalCart(cart);
      updateCartCount();
      return { success: true };
    }
  }

  async function removeFromCart(productId) {
    if (isLoggedIn()) {
      const res = await request(`/api/cart/items/${productId}`, {
        method: 'DELETE'
      });
      updateCartCount();
      return res;
    } else {
      let cart = getLocalCart();
      cart = cart.filter(i => i.id != productId);
      saveLocalCart(cart);
      updateCartCount();
      return { success: true };
    }
  }

  async function clearCart() {
    if (isLoggedIn()) {
      await request('/api/cart/clear', { method: 'DELETE' });
    }
    saveLocalCart([]);
    updateCartCount();
  }

  async function syncLocalCart() {
    const local = getLocalCart();
    if (local.length > 0 && isLoggedIn()) {
      try {
        await request('/api/cart/sync', {
          method: 'POST',
          body: { localItems: local }
        });
        localStorage.removeItem(CART_KEY);
      } catch (e) {
        console.error('Failed to sync local cart:', e);
      }
    }
  }

  async function updateCartCount() {
    try {
      let count = 0;
      if (isLoggedIn()) {
        const cart = await getCart();
        count = cart.totalItems || 0;
      } else {
        const local = getLocalCart();
        count = local.reduce((sum, item) => sum + (item.qty || 1), 0);
      }

      document.querySelectorAll('.cart-badge, #cartBadge, #navCartCount').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
      });
    } catch (e) {
      // Ignore
    }
  }

  // ---------------- ORDER APIS ----------------
  async function createOrder(orderData) {
    return await request('/api/orders', {
      method: 'POST',
      body: orderData
    });
  }

  async function getUserOrders() {
    return await request('/api/orders');
  }

  async function getOrderById(id) {
    return await request(`/api/orders/${id}`);
  }

  async function trackOrder(identifier) {
    return await request(`/api/orders/track/${encodeURIComponent(identifier)}`);
  }

  async function cancelOrder(id) {
    return await request(`/api/orders/${id}/cancel`, {
      method: 'PUT'
    });
  }

  // ---------------- PAYMENT APIS ----------------
  async function processPayment(paymentData) {
    return await request('/api/payment/process', {
      method: 'POST',
      body: paymentData
    });
  }

  async function verifyUPI(orderId) {
    return await request('/api/payment/verify-upi', {
      method: 'POST',
      body: { orderId }
    });
  }

  // ---------------- ADMIN APIS ----------------
  async function getAdminStats() {
    return await request('/api/admin/stats');
  }

  async function getAdminOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await request(`/api/admin/orders${query ? '?' + query : ''}`);
  }

  async function updateOrderStatus(orderId, status, description, location) {
    return await request(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status, description, location }
    });
  }

  async function createAdminProduct(data) {
    return await request('/api/admin/products', {
      method: 'POST',
      body: data
    });
  }

  async function updateAdminProduct(id, data) {
    return await request(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  async function deleteAdminProduct(id) {
    return await request(`/api/admin/products/${id}`, {
      method: 'DELETE'
    });
  }

  // ---------------- UI & NAVBAR HELPER ----------------
  function setupNavbar() {
    const user = getUser();
    const logged = isLoggedIn();

    // Setup nav right or dynamic headers
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
      if (logged && user) {
        navRight.innerHTML = `
          ${user.role === 'admin' ? '<button id="adminNavBtn" class="nav-admin-badge" onclick="window.location.href=\'admin.html\'">⚡ Admin Panel</button>' : ''}
          <button id="ordersBtn" onclick="window.location.href='orders.html'">📦 My Orders</button>
          <button id="trackBtn" onclick="window.location.href='trackorder.html'">🚚 Track</button>
          <button id="cartBtn" class="nav-cart-btn" onclick="window.location.href='cart.html'">
            🛒 Cart <span class="cart-badge" id="navCartCount" style="display:none;">0</span>
          </button>
          <div class="user-dropdown">
            <button class="user-profile-btn" onclick="window.location.href='profile.html'">
              👤 ${user.name.split(' ')[0]}
            </button>
          </div>
          <button id="logoutBtn" class="nav-logout-btn" onclick="API.logout()">Logout</button>
        `;
      } else {
        navRight.innerHTML = `
          <button id="trackBtn" onclick="window.location.href='trackorder.html'">🚚 Track</button>
          <button id="cartBtn" class="nav-cart-btn" onclick="window.location.href='cart.html'">
            🛒 Cart <span class="cart-badge" id="navCartCount" style="display:none;">0</span>
          </button>
          <button class="nav-login-btn" onclick="window.location.href='login.html'">Login</button>
          <button class="nav-signup-btn" onclick="window.location.href='signup.html'">Sign Up</button>
        `;
      }
    }

    // Top navbar for landing page links
    const landingNavLinks = document.querySelector('.nav-links');
    if (landingNavLinks && !landingNavLinks.classList.contains('custom-handled')) {
      landingNavLinks.classList.add('custom-handled');
      if (logged && user) {
        landingNavLinks.innerHTML = `
          <li><a href="index.html">Home</a></li>
          <li><a href="home.html">Shop Catalog</a></li>
          <li><a href="orders.html">My Orders</a></li>
          <li><a href="trackorder.html">Track Order</a></li>
          ${user.role === 'admin' ? '<li><a href="admin.html" style="color:#f59e0b;font-weight:700;">Admin</a></li>' : ''}
          <li><a href="cart.html">Cart (<span id="landingCartBadge">0</span>)</a></li>
          <li><a href="profile.html">👤 ${user.name.split(' ')[0]}</a></li>
          <li><a href="#" onclick="API.logout(); return false;">Logout</a></li>
        `;
      }
    }

    updateCartCount();
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    setupNavbar();
    updateCartCount();
  });

  // Export to global scope
  window.API = {
    getToken,
    getUser,
    setAuth,
    logout,
    isLoggedIn,
    isAdmin,
    request,
    register,
    login,
    getProfile,
    updateProfile,
    getProducts,
    getCategories,
    getProductById,
    addProductReview,
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    syncLocalCart,
    updateCartCount,
    createOrder,
    getUserOrders,
    getOrderById,
    trackOrder,
    cancelOrder,
    processPayment,
    verifyUPI,
    getAdminStats,
    getAdminOrders,
    updateOrderStatus,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
    setupNavbar
  };
})(window);
