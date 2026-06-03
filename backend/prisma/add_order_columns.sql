ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS store_id INTEGER,
ADD COLUMN IF NOT EXISTS customer_latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS customer_longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS shipping_distance_meters NUMERIC;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_stores'
  ) THEN 
    ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_stores 
    FOREIGN KEY (store_id) REFERENCES stores(store_id);
  END IF; 
END $$;
