-- MyShop database initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS store;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS seller;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Auth
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'vendeur', 'manager')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(30),
  store_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store
CREATE TABLE IF NOT EXISTS store.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  tagline VARCHAR(300),
  short_description TEXT,
  description TEXT,
  logo_url TEXT,
  photos JSONB DEFAULT '[]',
  cover_index INT DEFAULT 0,
  categories JSONB DEFAULT '[]',
  main_category VARCHAR(100),
  subcategories JSONB DEFAULT '[]',
  address TEXT,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'CI',
  landmark VARCHAR(200),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  service_radius_km DECIMAL(5,2) DEFAULT 10,
  hours JSONB DEFAULT '[]',
  phone VARCHAR(30),
  email VARCHAR(255),
  payment_methods JSONB DEFAULT '[]',
  currency VARCHAR(3) DEFAULT 'XOF',
  tax_rate DECIMAL(5,2) DEFAULT 18,
  delivery BOOLEAN DEFAULT TRUE,
  pickup BOOLEAN DEFAULT TRUE,
  capacity INT DEFAULT 50,
  founded_year INT,
  legal_status VARCHAR(100),
  registration_number VARCHAR(100),
  access_code VARCHAR(20) NOT NULL,
  access_code_expiry TIMESTAMPTZ,
  max_sellers INT DEFAULT 10,
  auto_approve_sellers BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'draft',
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalog
CREATE TABLE IF NOT EXISTS catalog.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  color VARCHAR(20),
  subcategories JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(300) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES catalog.categories(id),
  subcategory_id VARCHAR(100),
  store_id UUID NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  compare_at_price DECIMAL(12,2),
  cost DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'XOF',
  stock INT DEFAULT 0,
  image_url TEXT,
  gallery JSONB DEFAULT '[]',
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  variants JSONB DEFAULT '[]',
  specs JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  views INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_store ON catalog.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON catalog.products(category_id);

-- Orders
CREATE TABLE IF NOT EXISTS orders.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  session_id VARCHAR(100),
  items JSONB DEFAULT '[]',
  promo_code VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(30) NOT NULL UNIQUE,
  user_id UUID,
  store_id UUID NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  status VARCHAR(20) DEFAULT 'pending',
  fulfillment_mode VARCHAR(20) DEFAULT 'pickup',
  contact_name VARCHAR(200),
  contact_phone VARCHAR(30),
  contact_email VARCHAR(255),
  payment_method VARCHAR(30),
  qr_payload TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID,
  seller_rating INT,
  seller_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(12,2) DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  fulfillment_modes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_store ON orders.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders.orders(status);

-- Seller
CREATE TABLE IF NOT EXISTS seller.sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30),
  avatar_url TEXT,
  birth_date DATE,
  id_type VARCHAR(50),
  id_number VARCHAR(100),
  store_id UUID NOT NULL,
  position VARCHAR(100),
  shift VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  revenue DECIMAL(14,2) DEFAULT 0,
  avg_handover_minutes DECIMAL(5,2) DEFAULT 0,
  monthly_target DECIMAL(12,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES seller.sellers(id),
  order_id UUID,
  user_id UUID,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (preferences & sync)
CREATE TABLE IF NOT EXISTS users.preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  session_id VARCHAR(100) UNIQUE,
  completed_onboarding BOOLEAN DEFAULT FALSE,
  domains JSONB DEFAULT '[]',
  subcategories JSONB DEFAULT '[]',
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  city VARCHAR(100),
  radius_km DECIMAL(5,2) DEFAULT 10,
  preferred_mode VARCHAR(20) DEFAULT 'pickup',
  theme VARCHAR(20) DEFAULT 'system',
  currency VARCHAR(3) DEFAULT 'XOF',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  session_id VARCHAR(100),
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (user_id, product_id),
  UNIQUE NULLS NOT DISTINCT (session_id, product_id)
);

-- Analytics cache
CREATE TABLE IF NOT EXISTS analytics.daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  store_id UUID,
  revenue DECIMAL(14,2) DEFAULT 0,
  orders_count INT DEFAULT 0,
  avg_basket DECIMAL(12,2) DEFAULT 0,
  unique_clients INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date, store_id)
);

-- Seed promo codes
INSERT INTO orders.promo_codes (code, type, value, min_amount, fulfillment_modes)
VALUES
  ('BIENVENUE10', 'percent', 10, 5000, '["pickup","delivery"]'),
  ('BOUTIKA5', 'percent', 5, 0, '["pickup","delivery"]'),
  ('RETRAIT15', 'percent', 15, 10000, '["pickup"]')
ON CONFLICT (code) DO NOTHING;
