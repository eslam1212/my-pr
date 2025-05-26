-- 1. Add columns to 'products' table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS is_serial_tracked BOOLEAN DEFAULT FALSE NOT NULL;

-- Add unique constraint for barcode if it should be unique when present
-- Using a partial index for uniqueness on non-NULL barcodes
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique_not_null
ON public.products (barcode)
WHERE barcode IS NOT NULL;

COMMENT ON COLUMN public.products.barcode IS 'Product barcode (EAN, UPC, etc.). Unique if provided.';
COMMENT ON COLUMN public.products.is_serial_tracked IS 'Indicates if the product units are tracked by individual serial numbers.';

-- 2. Create 'serial_numbers' table
CREATE TABLE IF NOT EXISTS public.serial_numbers (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    serial_number TEXT NOT NULL,
    status TEXT DEFAULT 'in_stock' NOT NULL, -- e.g., 'in_stock', 'sold', 'transferred_out', 'defective', 'returned', 'consumed'
    -- purchase_item_id BIGINT REFERENCES public.purchase_order_items(id) ON DELETE SET NULL, -- Assuming purchase_order_items table
    -- invoice_item_id BIGINT REFERENCES public.invoice_items(id) ON DELETE SET NULL,       -- For linking to sale
    -- current_location_id BIGINT REFERENCES public.locations(id) ON DELETE SET NULL, -- Assuming locations table
    notes TEXT, -- For any additional notes about this specific serial number
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_product_serial_number UNIQUE (product_id, serial_number)
);

COMMENT ON TABLE public.serial_numbers IS 'Stores individual serial numbers for tracked products.';
COMMENT ON COLUMN public.serial_numbers.status IS 'Current status of the serial number unit.';
-- COMMENT ON COLUMN public.serial_numbers.purchase_item_id IS 'Link to the purchase order item through which this serial entered stock.';
-- COMMENT ON COLUMN public.serial_numbers.invoice_item_id IS 'Link to the invoice item through which this serial was sold.';
-- COMMENT ON COLUMN public.serial_numbers.current_location_id IS 'Current physical or logical location of the serial number.';

-- Apply trigger for 'updated_at' on 'serial_numbers'
-- (Assuming trigger_set_timestamp function already exists from previous migrations)
CREATE TRIGGER set_timestamp_serial_numbers_updated_at
BEFORE UPDATE ON public.serial_numbers
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


-- 3. Create 'transaction_item_serials' junction table
-- This table links specific serial numbers to specific lines in transactions.
CREATE TABLE IF NOT EXISTS public.transaction_item_serials (
    id BIGSERIAL PRIMARY KEY,
    -- Link to transaction item tables. At least one should be non-null.
    invoice_item_id BIGINT REFERENCES public.invoice_items(id) ON DELETE CASCADE,
    -- purchase_order_item_id BIGINT REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
    -- stock_transfer_item_id BIGINT REFERENCES public.stock_transfer_items(id) ON DELETE CASCADE,
    -- stock_adjustment_item_id BIGINT REFERENCES public.stock_adjustment_items(id) ON DELETE CASCADE,
    
    serial_number_id BIGINT NOT NULL REFERENCES public.serial_numbers(id) ON DELETE RESTRICT, -- Prevent deleting SN if tied to transaction
    transaction_type TEXT NOT NULL, -- e.g., 'sale', 'purchase_receipt', 'transfer_out', 'transfer_in', 'stock_adjustment'
    
    -- Optional: Store quantity if a transaction item could involve multiple serials (though usually 1 for serial tracked)
    -- quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0), 
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    -- No updated_at here as these records are typically immutable facts of a transaction.
);

COMMENT ON TABLE public.transaction_item_serials IS 'Links serial numbers to specific transaction line items.';
COMMENT ON COLUMN public.transaction_item_serials.invoice_item_id IS 'Link to an item on a sales invoice.';
-- COMMENT ON COLUMN public.transaction_item_serials.purchase_order_item_id IS 'Link to an item on a purchase order receipt.';
-- COMMENT ON COLUMN public.transaction_item_serials.stock_transfer_item_id IS 'Link to an item on a stock transfer document.';
COMMENT ON COLUMN public.transaction_item_serials.serial_number_id IS 'The specific serial number involved in the transaction item.';
COMMENT ON COLUMN public.transaction_item_serials.transaction_type IS 'Type of transaction this serial link pertains to.';

-- Add check constraint to ensure at least one transaction item ID is present
-- This needs to be adapted if more transaction item types are added.
-- For now, only invoice_item_id is uncommented.
-- ALTER TABLE public.transaction_item_serials
-- ADD CONSTRAINT chk_transaction_item_presence
-- CHECK (
--    COALESCE(invoice_item_id, purchase_order_item_id, stock_transfer_item_id, stock_adjustment_item_id) IS NOT NULL
-- );

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_id ON public.serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON public.serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_transaction_item_serials_invoice_item_id ON public.transaction_item_serials(invoice_item_id);
-- CREATE INDEX IF NOT EXISTS idx_transaction_item_serials_purchase_item_id ON public.transaction_item_serials(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_transaction_item_serials_serial_number_id ON public.transaction_item_serials(serial_number_id);

-- Note: The commented out FKs (purchase_item_id, current_location_id in serial_numbers, 
-- and purchase_order_item_id, stock_transfer_item_id in transaction_item_serials) 
-- depend on other tables (purchase_order_items, locations, stock_transfer_items) which are not yet defined
-- in this specific migration. They should be added/uncommented when those tables are available.
-- For the purpose of this task, I'll focus on the core structure with sales invoices.
-- The CHECK constraint in transaction_item_serials is also commented out until other item types are added.
