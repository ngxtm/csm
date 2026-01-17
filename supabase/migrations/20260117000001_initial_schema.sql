-- ==========================================
-- CKMS Initial Schema (Single-chain)
-- Migration: 20260117000001_initial_schema.sql
-- ==========================================

-- ==========================================
-- 1. LOCATIONS
-- ==========================================

CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'franchise'
    CHECK (type IN ('franchise', 'central_kitchen')),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. AUTHENTICATION & USERS
-- ==========================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL
    CHECK (role IN ('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')),
  store_id INTEGER REFERENCES stores(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. PRODUCT MANAGEMENT & RECIPES
-- ==========================================

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  category_id INTEGER REFERENCES categories(id),
  unit VARCHAR(20) NOT NULL
    CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs', 'box', 'can', 'pack')),
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('material', 'semi_finished', 'finished_product')),
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipe_details (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES items(id),
  quantity DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, material_id)
);

-- ==========================================
-- 4. INVENTORY, BATCHES & ALERTS
-- ==========================================

CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  batch_code VARCHAR(100) UNIQUE NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(id),
  manufacture_date DATE,
  expiry_date DATE,
  initial_quantity DECIMAL(10, 2) NOT NULL,
  current_quantity DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'depleted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_stock_level DECIMAL(10, 2) DEFAULT 0,
  max_stock_level DECIMAL(10, 2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, item_id)
);

CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  batch_id INTEGER REFERENCES batches(id),
  quantity_change DECIMAL(10, 2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL
    CHECK (transaction_type IN ('import', 'export', 'production', 'waste', 'return', 'adjustment')),
  reference_type VARCHAR(50),
  reference_id INTEGER,
  note TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id),
  item_id INTEGER REFERENCES items(id),
  batch_id INTEGER REFERENCES batches(id),
  alert_type VARCHAR(30) NOT NULL
    CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiring_soon', 'expired_found')),
  message TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. ORDERING & FULFILLMENT
-- ==========================================

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(50) UNIQUE NOT NULL,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  created_by UUID REFERENCES users(id),
  confirmed_by UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'processing', 'shipping', 'delivered', 'cancelled')),
  total_amount DECIMAL(15, 2),
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  quantity_ordered DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  shipment_code VARCHAR(50) UNIQUE NOT NULL,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  status VARCHAR(20) NOT NULL DEFAULT 'preparing'
    CHECK (status IN ('preparing', 'shipping', 'delivered', 'failed')),
  driver_name VARCHAR(255),
  driver_phone VARCHAR(20),
  shipped_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipment_items (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id),
  batch_id INTEGER REFERENCES batches(id),
  quantity_shipped DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. PRODUCTION PLANNING
-- ==========================================

CREATE TABLE production_plans (
  id SERIAL PRIMARY KEY,
  plan_code VARCHAR(50) UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE production_details (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES production_plans(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  quantity_planned DECIMAL(10, 2) NOT NULL,
  quantity_produced DECIMAL(10, 2) DEFAULT 0,
  batch_id INTEGER REFERENCES batches(id),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. PERFORMANCE INDEXES
-- ==========================================

-- Foreign Key Indexes
CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_recipe_product ON recipe_details(product_id);
CREATE INDEX idx_recipe_material ON recipe_details(material_id);
CREATE INDEX idx_batches_item ON batches(item_id);
CREATE INDEX idx_inventory_store ON inventory(store_id);
CREATE INDEX idx_inventory_item ON inventory(item_id);
CREATE INDEX idx_inv_trans_store ON inventory_transactions(store_id);
CREATE INDEX idx_inv_trans_item ON inventory_transactions(item_id);
CREATE INDEX idx_inv_trans_batch ON inventory_transactions(batch_id);
CREATE INDEX idx_alerts_store ON alerts(store_id);
CREATE INDEX idx_alerts_item ON alerts(item_id);
CREATE INDEX idx_alerts_batch ON alerts(batch_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_item ON order_items(item_id);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_order_item ON shipment_items(order_item_id);
CREATE INDEX idx_shipment_items_batch ON shipment_items(batch_id);
CREATE INDEX idx_prod_details_plan ON production_details(plan_id);
CREATE INDEX idx_prod_details_item ON production_details(item_id);
CREATE INDEX idx_prod_details_batch ON production_details(batch_id);

-- Common Query Pattern Indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_delivery ON orders(delivery_date);
CREATE INDEX idx_batches_expiry_active ON batches(expiry_date) WHERE status = 'active';
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_alerts_unresolved ON alerts(created_at DESC) WHERE is_resolved = false;
CREATE INDEX idx_items_active ON items(id) WHERE is_active = true;
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_prod_plans_status ON production_plans(status);
CREATE INDEX idx_prod_details_status ON production_details(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_inv_trans_created ON inventory_transactions(created_at DESC);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type);

-- ==========================================
-- 8. AUTO-UPDATE TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_stores_updated BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_items_updated BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_shipments_updated BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_production_plans_updated BEFORE UPDATE ON production_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 9. ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_details ENABLE ROW LEVEL SECURITY;

-- Basic read policies (authenticated users can read all)
CREATE POLICY "auth_read" ON stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON shipment_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON production_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON production_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON recipe_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON inventory_transactions FOR SELECT TO authenticated USING (true);

-- Users policies
CREATE POLICY "users_read_own" ON users FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "admin_read_users" ON users FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Write policies (service role bypasses RLS, so these are for direct client access)
CREATE POLICY "auth_insert" ON stores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON stores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON shipments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON shipments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON shipment_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON production_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON production_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON production_details FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON production_details FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_insert" ON recipe_details FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);
