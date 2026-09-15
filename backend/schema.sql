-- UniMall Multi-Store Relational Database Schema
PRAGMA foreign_keys = ON;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'store_owner', 'platform_admin')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. STORES
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    phone TEXT,
    image_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_open INTEGER NOT NULL DEFAULT 1,
    accepts_delivery INTEGER NOT NULL DEFAULT 1,
    accepts_pickup INTEGER NOT NULL DEFAULT 1,
    hours_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 3. STORE MEMBERSHIPS (Multi-store authorization)
CREATE TABLE IF NOT EXISTS store_memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK(role IN ('owner', 'manager', 'staff')),
    created_at TEXT NOT NULL,
    UNIQUE(user_id, store_id)
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    sku TEXT,
    price REAL NOT NULL,
    compare_at_price REAL,
    image_url TEXT,
    unit TEXT NOT NULL DEFAULT 'item',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 6. INVENTORY (Decoupled from product definition)
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    product_id TEXT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    updated_at TEXT NOT NULL
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    status TEXT NOT NULL CHECK(status IN ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED')),
    subtotal REAL NOT NULL,
    delivery_fee REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    delivery_method TEXT NOT NULL CHECK(delivery_method IN ('delivery', 'pickup')),
    delivery_address TEXT,
    payment_status TEXT NOT NULL DEFAULT 'paid',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 8. ORDER ITEMS (Snapshots of item details at time of purchase)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_name_snapshot TEXT NOT NULL,
    price_snapshot REAL NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
    created_at TEXT NOT NULL
);

-- 9. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id TEXT REFERENCES stores(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL
);

-- 10. PRODUCT REQUESTS (Student demand signals)
CREATE TABLE IF NOT EXISTS product_requests (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES stores(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'considering' CHECK(status IN ('considering', 'available', 'dismissed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 11. USER SESSIONS (Server-side token store)
CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- INDEXES for fast operational querying
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_store ON order_items(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON store_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_store ON audit_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
