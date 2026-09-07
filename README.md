<div align="center">

# ⚡ OrderMe - Production-Ready Full-Stack E-Commerce System

**A modern, lightning-fast full-stack e-commerce web platform with Node.js, Express, SQLite, JWT Authentication, Simulated Multi-Payment Gateways, Live Order Tracking, and an Admin Management Dashboard.**

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Native%20node%3Asqlite-003B57.svg)](https://www.sqlite.org/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt-orange.svg)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 🌟 Highlights & Architecture

- **Zero-Configuration Relational Database**: Uses Node.js native `node:sqlite` engine. Creates tables and automatically seeds rich categories, products, demo accounts, and sample orders on first launch — no external database server setup required.
- **Robust REST API Backend**: Modular MVC pattern (`controllers/`, `routes/`, `middleware/`, `config/`) with secure JSON Web Token (JWT) authentication and role-based access control (`customer` & `admin`).
- **Synchronized Cart**: Real-time cart state synchronization between local guest storage and database for authenticated users.
- **Interactive Simulated Payment Gateways**: Credit/Debit card with live visual formatting, instant UPI QR code simulator with real-time countdown, and Cash on Delivery.
- **Live 5-Stage Package Tracking**: Real-time progress timeline (Placed &rarr; Confirmed &rarr; Shipped &rarr; Out for Delivery &rarr; Delivered) with simulated delivery partner info and timestamps.
- **Comprehensive Admin Control Center**: Metrics overview (Revenue, Total Orders, Customers, Low Stock alerts), real-time order status switcher, and full Product Catalog CRUD manager.
- **Polished Vanilla Frontend**: Modern glassmorphism accents, responsive CSS grid/flexbox, Google Fonts, and non-blocking toast notifications.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) version 22.5.0 or higher.

### Installation

1. **Clone or download this repository**:
   ```bash
   git clone https://github.com/your-username/orderme-ecommerce.git
   cd orderme-ecommerce
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Open in your browser**:
   - 🛒 **Storefront & Catalog**: [http://localhost:5000](http://localhost:5000)
   - 🔐 **Admin Control Center**: [http://localhost:5000/admin.html](http://localhost:5000/admin.html)
   - 📡 **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Accounts (Ready to Test)

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Admin** | `admin@orderme.com` | `admin123` | Full Admin Dashboard, Change Order Statuses, Add/Edit/Delete Products, View Analytics |
| **Customer** | `user@orderme.com` | `password123` | Browse Catalog, Manage Cart, Place Orders, Live Tracking, Profile Editor |

*(You can also use the 1-click **Quick Demo Login** buttons on the Login page for instant access!)*

---

## 📂 Project Structure

```
├── config/
│   ├── db.js                 # SQLite database connection & schema tables
│   └── seed.js               # Auto-seeder for categories, products, demo users
├── controllers/
│   ├── adminController.js    # Analytics, order status overrides, product CRUD
│   ├── authController.js     # User registration, login, profile management
│   ├── cartController.js     # Cart synchronization, add/update/remove items
│   ├── orderController.js    # Order placement, user history, tracking
│   ├── paymentController.js  # Card, UPI verification, and COD handling
│   └── productController.js  # Catalog listing, search, category filters, reviews
├── middleware/
│   ├── auth.js               # JWT verification & RBAC authorization
│   └── errorHandler.js       # Centralized error handler & 404 handler
├── routes/
│   ├── adminRoutes.js        # Protected /api/admin endpoints
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── cartRoutes.js         # /api/cart endpoints
│   ├── orderRoutes.js        # /api/orders endpoints
│   ├── paymentRoutes.js      # /api/payment endpoints
│   └── productRoutes.js      # /api/products endpoints
├── js/
│   ├── api.js                # Frontend REST API client & session manager
│   └── toast.js              # Custom animated toast notifications
├── index.html                # Landing page with hero slider & featured items
├── home.html                 # Main storefront catalog & category browser
├── cart.html                 # Shopping cart with coupon discount system
├── checkout.html             # Multi-step checkout & address review
├── payment.html              # Interactive Card, UPI QR, and COD gateway
├── orders.html               # Customer order history & status filter tabs
├── trackorder.html           # Live 5-stage package tracker
├── admin.html                # Admin management dashboard
├── profile.html              # Customer profile & address settings
├── login.html                # JWT Login with 1-click demo buttons
├── signup.html               # New user registration
├── style.css                 # Landing page stylesheet
├── home.css                  # Master storefront stylesheet
├── auth.css                  # Authentication pages stylesheet
├── admin.css                 # Admin portal stylesheet
├── toast.css                 # Toast notification stylesheet
├── server.js                 # Express server & API routes mount
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore configuration
└── package.json              # Project scripts & dependencies
```

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer Token |
| `PUT` | `/api/auth/profile` | Update profile details / password | Bearer Token |

### 🛍️ Products & Categories (`/api/products`, `/api/categories`)
| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/products` | List products | `q`, `category`, `sort`, `minPrice`, `maxPrice`, `page`, `limit` |
| `GET` | `/api/products/:id` | Get product details & reviews | - |
| `GET` | `/api/categories` | List all categories with item count | - |
| `POST` | `/api/products/:id/reviews` | Submit product review | Bearer Token |

### 🛒 Cart Management (`/api/cart`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/cart` | Get current user's synced cart | Bearer Token |
| `POST` | `/api/cart/add` | Add product to cart | Bearer Token |
| `PUT` | `/api/cart/items/:productId` | Update item quantity | Bearer Token |
| `DELETE` | `/api/cart/items/:productId` | Remove item from cart | Bearer Token |
| `DELETE` | `/api/cart/clear` | Clear all items from cart | Bearer Token |
| `POST` | `/api/cart/sync` | Merge guest local storage items | Bearer Token |

### 📦 Orders & Tracking (`/api/orders`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/orders` | Place a new order | Optional Auth |
| `GET` | `/api/orders` | Get user order history | Bearer Token |
| `GET` | `/api/orders/:id` | Get order details & tracking events | Optional Auth |
| `GET` | `/api/orders/track/:identifier` | Public tracking lookup by Order ID | No |
| `PUT` | `/api/orders/:id/cancel` | Cancel an active order | Bearer Token |

### 💳 Payments (`/api/payment`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payment/process` | Process Card, UPI or COD transaction |
| `POST` | `/api/payment/verify-upi` | Simulate instant UPI approval callback |

### ⚡ Admin Management (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/stats` | KPI metrics (Revenue, Orders, Low Stock) | Admin Token |
| `GET` | `/api/admin/orders` | View and filter all system orders | Admin Token |
| `PUT` | `/api/admin/orders/:id/status` | Update order status and add tracking step | Admin Token |
| `POST` | `/api/admin/products` | Create a new catalog product | Admin Token |
| `PUT` | `/api/admin/products/:id` | Edit product pricing, stock, details | Admin Token |
| `DELETE` | `/api/admin/products/:id` | Delete product from catalog | Admin Token |

---

## 📤 How to Upload this Project to GitHub

Follow these steps in your terminal to publish this repository to your GitHub account:

### 1. Initialize Git Repository
```bash
git init
```

### 2. Stage and Commit All Files
```bash
git add .
git commit -m "feat: complete full-stack e-commerce system with Node.js, Express, SQLite, and Admin portal"
```

### 3. Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Enter a repository name (e.g., `orderme-ecommerce`).
3. Leave it **Public** (or Private) and do not check "Initialize with README".
4. Click **Create repository**.

### 4. Link Remote and Push to GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/orderme-ecommerce.git
git push -u origin main
```

---

## 📜 License
This project is licensed under the MIT License — feel free to use and customize for personal or commercial projects.
