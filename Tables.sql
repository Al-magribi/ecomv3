-- Active: 1763557345068@@103.150.226.156@5432@ecom
CREATE TABLE configurations (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL, -- Nama variabel (misal: midtrans_server_key)
    value TEXT,                       -- Nilainya
    category VARCHAR(50) DEFAULT 'general', -- Pengelompokan (payment, smtp, store)
    description TEXT,                 -- Penjelasan (untuk label di Admin UI)
    type VARCHAR(20) DEFAULT 'string', -- text, number, boolean, image (untuk input type di frontend)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO configurations (category, key, value, description, type) VALUES
('store', 'store_name', 'TOSERBA', 'Nama Toko', 'string'),
('store', 'store_address', 'Jl. Raya Bogor No. 123, Jawa Barat, Indonesia', 'Alamat Lengkap Toko', 'text'),
('store', 'store_logo', '/assets/shop/logo.png', 'URL Logo Toko', 'image'),
('store', 'store_favicon', '/assets/shop/favicon.png', 'URL Favicon Toko', 'image'),
('payment', 'midtrans_server_key', 'SB-Mid-server-xxxxxxxx', 'Midtrans Server Key', 'string'),
('payment', 'midtrans_client_key', 'SB-Mid-client-xxxxxxxx', 'Midtrans Client Key', 'string'),
('payment', 'midtrans_merchant_id', 'Gxxxxxxxx', 'Midtrans Merchant ID', 'string'),
('payment', 'midtrans_base_url', 'https://app.sandbox.midtrans.com', 'Midtrans API Base URL', 'string'),
('payment', 'midtrans_is_production', 'false', 'Status Production (true/false)', 'boolean'),
('smtp', 'smtp_host', 'smtp.gmail.com', 'SMTP Host Server', 'string'),
('smtp', 'smtp_port', '25', 'SMTP Port', 'number'),
('smtp', 'smtp_user', 'almagribi.appdev@gmail.com', 'SMTP Email User', 'string'),
('smtp', 'smtp_pass', 'xxxxxxxx', 'SMTP App Password', 'password'), -- Tipe 'password' agar di UI frontend inputnya titik-titik (hidden)
('smtp', 'smtp_from_email', 'no-reply@toserba.com', 'Email Pengirim', 'string'),
('smtp', 'smtp_from_name', 'TOSERBA System', 'Nama Pengirim Email', 'string');

INSERT INTO configurations (category, key, value, description, type) VALUES
('shipping', 'shipping_api', '7bb197bedea1c1c149042aef68b0e2ee', 'API RAJA ONGKIR', 'string'),
('shipping', 'shipping_origin', '8122', 'Lokasi Toko', 'string');

-- ====================================================================================
-- BAGIAN 1: BERSIHKAN DATABASE (RESET)
-- Urutan penghapusan dari Child ke Parent untuk menghindari Foreign Key Error
-- ====================================================================================
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS addresses CASCADE; -- Table baru
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS villages CASCADE; -- Table baru
DROP TABLE IF EXISTS districts CASCADE; -- Table baru
DROP TABLE IF EXISTS regencies CASCADE; -- Table baru
DROP TABLE IF EXISTS provinces CASCADE; -- Table baru

-- ====================================================================================
-- BAGIAN 2: STRUKTUR TABLE (SCHEMA)
-- Urutan pembuatan dari Parent ke Child
-- ====================================================================================

-- 1. TABEL WILAYAH (Hierarchy: Province -> Regency -> District -> Village)
CREATE TABLE provinces (
    id CHAR(2) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE regencies (
    id CHAR(4) PRIMARY KEY,
    province_id CHAR(2) REFERENCES provinces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE districts (
    id CHAR(7) PRIMARY KEY, -- ID Kecamatan (Penting untuk RajaOngkir/Komerce)
    regency_id CHAR(4) REFERENCES regencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE villages (
    id CHAR(12) PRIMARY KEY,
    district_id CHAR(7) REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE couriers(
    id SERIAL PRIMARY KEY,
    courier VARCHAR(100),
    code VARCHAR(30),
    isactive BOOLEAN DEFAULT true
);

-- 2. TABEL USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    avatar TEXT,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    activation_code VARCHAR(255),
    activation_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT false,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL ADDRESSES (Buku Alamat User)
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(50) DEFAULT 'Rumah',
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    province_id CHAR(2) REFERENCES provinces(id),
    regency_id CHAR(4) REFERENCES regencies(id),
    district_id CHAR(7) REFERENCES districts(id),
    village_id CHAR(10) REFERENCES villages(id),
    shipping_id INTEGER,
    detail TEXT NOT NULL,
    postal_code VARCHAR(10),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL CATEGORIES
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 5. TABEL PRODUCTS
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) NOT NULL,
    capital DECIMAL(15, 2) NOT NULL,
    profit DECIMAL(15, 2) NOT NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    sold_count INTEGER DEFAULT 0,
    weight INTEGER, -- dalam gram
    rating NUMERIC(2, 1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 6. TABEL VARIANTS
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100), -- Contoh: "Merah XL"
    color VARCHAR(50),
    size VARCHAR(50),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    price_adjustment DECIMAL(15, 2) DEFAULT 0 -- Tambahan harga (bisa 0)
);

-- 7. TABEL IMAGES
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    link TEXT NOT NULL
);

-- 8. TABEL REVIEWS
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    replay TEXT,
    replay_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);



-- 9. TABEL CARTS
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL, 
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, product_variant_id)
);

-- 10. TABEL ORDERS
-- Menyimpan snapshot alamat pengiriman agar data historis aman
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    method VARCHAR(50),
    recipient_name VARCHAR(100),
    shipping_address_detail TEXT,
    shipping_village_id CHAR(10),
    shipping_district_id CHAR(7),
    shipping_regency_id CHAR(4),
    shipping_province_id CHAR(2),
    shipping_postal_code VARCHAR(10),    
    shipping_courier VARCHAR(50), -- JNE, J&T, POS
    shipping_service VARCHAR(50), -- REG, YES, OKE
    shipping_fee DECIMAL(15, 2) DEFAULT 0,
    shipping_number TEXT,
    total_price DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. TABEL ORDER ITEMS
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(15, 2) NOT NULL -- Harga saat transaksi terjadi
);

-- ====================================================================================
-- BAGIAN 3: FUNCTIONS & TRIGGERS
-- ====================================================================================

-- A. Function Update Rating
CREATE OR REPLACE FUNCTION update_product_rating() 
RETURNS TRIGGER AS $$
DECLARE
    target_product_id INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    UPDATE products 
    SET rating = (
        SELECT COALESCE(ROUND(AVG(rating), 1), 0)
        FROM reviews
        WHERE product_id = target_product_id 
    )
    WHERE id = target_product_id;

    RETURN NULL; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- B. Function Process Order (Stock Reduction & Sold Count)
CREATE OR REPLACE FUNCTION process_order_items() 
RETURNS TRIGGER AS $$
BEGIN
    -- Tambah Sold Count
    UPDATE products 
    SET sold_count = sold_count + NEW.quantity 
    WHERE id = NEW.product_id;

    -- Kurangi Stok
    IF NEW.product_variant_id IS NOT NULL THEN
        -- Kurangi stok varian
        UPDATE product_variants 
        SET stock = stock - NEW.quantity 
        WHERE id = NEW.product_variant_id;
        
        -- Sync Stok Induk (Total dari varian)
        UPDATE products p
        SET stock = (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id)
        WHERE id = NEW.product_id;
    ELSE
        -- Kurangi stok produk biasa
        UPDATE products 
        SET stock = stock - NEW.quantity 
        WHERE id = NEW.product_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_order
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION process_order_items();

-- C. Function Update Timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ====================================================================================
-- BAGIAN 4: SEEDING DATA (DUMMY)
-- ====================================================================================

-- 1. SEED Courier
INSERT INTO couriers(courier, code) VALUES
('JNE', 'jne'),
('SiCepat', 'sicepat'),
('IDExpress', 'ide'),
('SAP Express', 'sap'),
('Ninja', 'ninja'),
('J&T Express', 'jnt'),
('TIKI', 'tiki'),
('Wahana Express', 'wahana'),
('POS', 'pos'),
('Sentral Cargo', 'sentral'),
('Lion Parcel', 'lion'),
('Royal Express Asia', 'rex');

-- 2. SEED USERS
INSERT INTO users (name, email, password, is_active, role) VALUES 
('Administrator', 'admin@toserba.com', '$2b$12$7yQaBxbz/YwTTXxtYy7l/uH42rFs36n0GPb3wEUwqZdG7uITDyXma', true, 'admin'),
('Andi Saputra', 'andi@toserba.com', '$2b$12$7yQaBxbz/YwTTXxtYy7l/uH42rFs36n0GPb3wEUwqZdG7uITDyXma', true, 'user'),
('Budi Santoso', 'budi@toserba.com', '$2b$12$7yQaBxbz/YwTTXxtYy7l/uH42rFs36n0GPb3wEUwqZdG7uITDyXma', true, 'user'),
('Citra Lestari', 'citra@toserba.com', '$2b$12$7yQaBxbz/YwTTXxtYy7l/uH42rFs36n0GPb3wEUwqZdG7uITDyXma', true, 'user');

-- 3. SEED CATEGORIES
INSERT INTO categories (name) VALUES 
('Elektronik'), ('Fashion Pria'), ('Fashion Wanita'), ('Peralatan Rumah'), ('Hobi & Olahraga');

-- 4. SEED PRODUCTS (500 ITEMS)
INSERT INTO products (category_id, name, description, price, capital, profit, stock, weight)
SELECT 
    (floor(random() * 5) + 1)::int,
    (ARRAY['Promo', 'Terbaru', 'Exclusive', 'Best Seller', 'Murah'])[floor(random()*5)+1] || ' ' ||
    (ARRAY['Kemeja', 'Laptop', 'Sepatu', 'Tas', 'Jam Tangan', 'Celana', 'Topi', 'Kamera', 'Meja', 'Kursi'])[floor(random()*10)+1] || ' ' ||
    (ARRAY['Premium', 'Super', 'Original', 'Lokal', 'Impor', 'Series X', 'Gen 2'])[floor(random()*7)+1],
    'Deskripsi lengkap produk menjamin kualitas terbaik. Barang nomor seri ' || i,
    (floor(random() * 100) + 5) * 10000, 
    ((floor(random() * 100) + 5) * 10000) * 0.8,
    ((floor(random() * 100) + 5) * 10000) * 0.2,
    floor(random() * 100) + 1, 
    floor(random() * 2000) + 100 
FROM generate_series(1, 500) as i;

-- 5. SEED IMAGES
INSERT INTO images (product_id, link)
SELECT 
    p.id,
    'https://dummyimage.com/600x600/343a40/ffffff?text=' || REPLACE(p.name, ' ', '+')
FROM products p;

-- 6. SEED VARIANTS (Untuk Product ID 1-200)
INSERT INTO product_variants (product_id, color, size, name, stock, price_adjustment)
SELECT 
    p.id, v.color, v.size, v.color || ' ' || v.size,
    floor(random() * 20) + 1,
    (floor(random() * 3) * 5000)
FROM products p
CROSS JOIN LATERAL (
    SELECT 
        (ARRAY['Merah', 'Biru', 'Hitam'])[floor(random()*3)+1] as color,
        (ARRAY['M', 'L', 'XL'])[floor(random()*3)+1] as size
    FROM generate_series(1, 2)
) v
WHERE p.id <= 200;

-- Sync Stok Induk setelah insert varian
UPDATE products p
SET stock = (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id)
WHERE id <= 200;

-- 7. SEED ADDRESSES (Untuk setiap User)
DO $$
DECLARE
    r_user RECORD;
    v_village_id CHAR(10);
    v_district_id CHAR(7);
    v_regency_id CHAR(4);
    v_province_id CHAR(2);
BEGIN
    FOR r_user IN SELECT id, name FROM users WHERE role != 'admin' LOOP
        -- Ambil random wilayah dari data sample
        SELECT id, district_id INTO v_village_id, v_district_id FROM villages ORDER BY random() LIMIT 1;
        SELECT regency_id INTO v_regency_id FROM districts WHERE id = v_district_id;
        SELECT province_id INTO v_province_id FROM regencies WHERE id = v_regency_id;

        INSERT INTO addresses (user_id, recipient_name, phone, province_id, regency_id, district_id, village_id, detail, postal_code, is_primary)
        VALUES (r_user.id, r_user.name, '0812345678', v_province_id, v_regency_id, v_district_id, v_village_id, 'Jl. Mawar No. ' || r_user.id, '40115', true);
    END LOOP;
END $$;

-- 8. SEED ORDERS (Transaction & Shipping Logic)
DO $$
DECLARE
    r_user RECORD;
    v_addr RECORD;
    v_order_id INT;
    v_shipping_fee DECIMAL;
    i INT;
BEGIN
    FOR r_user IN SELECT id, name FROM users WHERE role != 'admin' LOOP
        
        -- Ambil alamat user
        SELECT * INTO v_addr FROM addresses WHERE user_id = r_user.id LIMIT 1;

        -- Buat 1-3 Order per User
        FOR i IN 1..(floor(random() * 3) + 1) LOOP
            v_shipping_fee := (floor(random() * 10) + 5) * 1000;

            -- Create Order Header
            INSERT INTO orders (
                user_id, invoice_number, status, total_price, 
                created_at, shipping_courier, shipping_service, shipping_fee,
                recipient_name, shipping_address_detail, shipping_village_id, shipping_district_id, shipping_regency_id, shipping_province_id, shipping_postal_code
            ) VALUES (
                r_user.id,
                'INV-' || to_char(NOW(), 'YYMMDD') || '-' || r_user.id || '-' || i || floor(random()*100),
                (ARRAY['pending', 'processing', 'completed'])[floor(random()*3)+1],
                0, -- Updated later
                NOW() - (random() * interval '30 days'),
                'jne', 'REG', v_shipping_fee,
                v_addr.recipient_name, v_addr.detail, v_addr.village_id, v_addr.district_id, v_addr.regency_id, v_addr.province_id, v_addr.postal_code
            ) RETURNING id INTO v_order_id;

            -- Create Order Items
            INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, price)
            SELECT 
                v_order_id, p.id, pv.id, 1, (p.price + COALESCE(pv.price_adjustment, 0))
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            ORDER BY random() LIMIT 2;

            -- Update Total
            UPDATE orders 
            SET total_price = (SELECT SUM(price * quantity) FROM order_items WHERE order_id = v_order_id) + v_shipping_fee
            WHERE id = v_order_id;
        END LOOP;
    END LOOP;
END $$;

-- 8. SEED CARTS
DO $$
DECLARE
    r_user RECORD;
    r_product RECORD;
    v_variant_id INT;
    v_qty INT;
    i INT;
BEGIN
    -- 1. Loop untuk setiap User KECUALI Admin
    FOR r_user IN SELECT id FROM users WHERE role != 'admin' LOOP
        
        -- 2. Generate 1 s/d 5 jenis barang per user
        FOR i IN 1..(floor(random() * 5) + 1) LOOP
            
            -- Ambil 1 Produk secara acak
            SELECT * INTO r_product FROM products ORDER BY random() LIMIT 1;

            -- Cek apakah produk punya varian? Ambil 1 varian acak jika ada.
            -- Jika produk tidak punya varian, v_variant_id akan menjadi NULL.
            SELECT id INTO v_variant_id 
            FROM product_variants 
            WHERE product_id = r_product.id 
            ORDER BY random() LIMIT 1;

            -- Tentukan Quantity acak (1-3 pcs)
            v_qty := (floor(random() * 3) + 1)::int;

            -- 3. Insert ke Table Carts
            INSERT INTO carts (user_id, product_id, product_variant_id, quantity)
            VALUES (
                r_user.id,
                r_product.id,
                v_variant_id,
                v_qty
            )
            -- Handle jika produk yang sama terpilih lagi (Upsert)
            -- Jika duplikat, tambahkan quantity-nya saja
            ON CONFLICT (user_id, product_id, product_variant_id) 
            DO UPDATE SET 
                quantity = carts.quantity + EXCLUDED.quantity,
                created_at = NOW(); -- Update timestamp agar terlihat baru
                
        END LOOP;
        
    END LOOP;
END $$;