-- C2: Add inventory deduction tracking to orders (idempotency guard)
-- Prevents double-deduction when order status is set to PREPARING multiple times

ALTER TABLE orders ADD COLUMN inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN inventory_deducted_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.inventory_deducted IS 'True after ingredient stock has been deducted for this order';
COMMENT ON COLUMN orders.inventory_deducted_at IS 'Timestamp when inventory deduction was performed';
