-- Seed sample products
INSERT INTO products (name, description, price, is_active) VALUES
  ('Laptop Dell XPS 13', 'High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD', 25000000, true),
  ('iPhone 15 Pro', 'Latest iPhone with A17 Pro chip, 256GB storage, titanium design', 30000000, true),
  ('Samsung Galaxy S24', 'Flagship Android phone with Snapdragon 8 Gen 3, 12GB RAM', 22000000, true),
  ('MacBook Air M3', 'Ultra-thin laptop with M3 chip, 16GB RAM, stunning Retina display', 35000000, true),
  ('iPad Pro 12.9"', 'Professional tablet with M2 chip, 256GB storage, ProMotion display', 28000000, true),
  ('Sony WH-1000XM5', 'Premium noise-cancelling wireless headphones with exceptional audio', 8000000, true),
  ('Dell UltraSharp Monitor', '27-inch 4K monitor with USB-C connectivity and excellent color accuracy', 12000000, true),
  ('Logitech MX Master 3S', 'Advanced wireless mouse with ergonomic design and precision tracking', 2500000, true)
ON CONFLICT DO NOTHING;
