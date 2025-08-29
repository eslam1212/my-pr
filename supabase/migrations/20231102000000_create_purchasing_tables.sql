-- Ensure the uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create 'suppliers' table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    -- Assuming user_id is not needed for suppliers as per previous schema for customers/suppliers
    -- If it was, it would be: user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.suppliers IS 'Stores information about product and service suppliers.';

-- Apply trigger for 'updated_at' on 'suppliers' if it's a new table or doesn't have it
-- (Assuming trigger_set_timestamp function already exists from previous migrations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_timestamp_suppliers_updated_at'
        AND tgrelid = 'public.suppliers'::regclass
    ) THEN
        CREATE TRIGGER set_timestamp_suppliers_updated_at
        BEFORE UPDATE ON public.suppliers
        FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
    END IF;
END $$;

-- Create ENUM type for purchase order status
CREATE TYPE public.purchase_order_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'partially_received',
    'fully_received',
    'cancelled'
);

-- 2. Create 'purchase_orders' table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    status public.purchase_order_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    shipping_address TEXT,
    total_amount NUMERIC(15, 2) DEFAULT 0.00, -- Precision 15, scale 2
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.purchase_orders IS 'Stores purchase order header information.';
COMMENT ON COLUMN public.purchase_orders.po_number IS 'Purchase Order number, can be auto-generated or manual.';
COMMENT ON COLUMN public.purchase_orders.total_amount IS 'Calculated total amount from purchase order items.';

-- Apply trigger for 'updated_at' on 'purchase_orders'
CREATE TRIGGER set_timestamp_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Indexes for 'purchase_orders'
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON public.purchase_orders(order_date);


-- 3. Create 'purchase_order_items' table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE, -- Cascade delete items if PO is deleted
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT, -- products.id is BIGINT
    description TEXT, -- Defaults to product name, but can be overridden
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(15, 2) NOT NULL, -- Should be calculated: quantity * unit_price
    received_quantity INTEGER DEFAULT 0 NOT NULL CHECK (received_quantity >= 0),
    -- No created_at/updated_at here, items are part of the PO's lifecycle. Could add if needed for item-specific changes.
    CONSTRAINT chk_received_not_greater_than_ordered CHECK (received_quantity <= quantity)
);

COMMENT ON TABLE public.purchase_order_items IS 'Stores individual line items for each purchase order.';
COMMENT ON COLUMN public.purchase_order_items.total_price IS 'Computed as quantity * unit_price. Can be enforced by a trigger or application logic.';
COMMENT ON COLUMN public.purchase_order_items.received_quantity IS 'Quantity of this item that has been received so far.';

-- Trigger to calculate total_price before insert/update on purchase_order_items
CREATE OR REPLACE FUNCTION public.calculate_po_item_total_price()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price = NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_po_item_total_price
BEFORE INSERT OR UPDATE OF quantity, unit_price ON public.purchase_order_items
FOR EACH ROW EXECUTE PROCEDURE public.calculate_po_item_total_price();


-- Trigger to update purchase_orders.total_amount when items change
CREATE OR REPLACE FUNCTION public.update_purchase_order_total()
RETURNS TRIGGER AS $$
DECLARE
    new_total NUMERIC;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        SELECT COALESCE(SUM(total_price), 0) INTO new_total
        FROM public.purchase_order_items
        WHERE purchase_order_id = OLD.purchase_order_id;

        UPDATE public.purchase_orders
        SET total_amount = new_total
        WHERE id = OLD.purchase_order_id;
    ELSE
        SELECT COALESCE(SUM(total_price), 0) INTO new_total
        FROM public.purchase_order_items
        WHERE purchase_order_id = NEW.purchase_order_id;

        UPDATE public.purchase_orders
        SET total_amount = new_total
        WHERE id = NEW.purchase_order_id;
    END IF;
    RETURN NULL; -- Result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchase_order_total
AFTER INSERT OR UPDATE OF total_price OR DELETE ON public.purchase_order_items
FOR EACH ROW EXECUTE PROCEDURE public.update_purchase_order_total();


-- Indexes for 'purchase_order_items'
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);

-- Add FK from serial_numbers.purchase_item_id to purchase_order_items.id (if not already handled)
-- This was commented out in a previous migration. Let's ensure it's set up if serial_numbers exists.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'serial_numbers' AND table_schema = 'public') THEN
        -- First, check if the column exists. If not, add it.
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='serial_numbers' AND column_name='purchase_item_id' AND table_schema='public'
        ) THEN
            ALTER TABLE public.serial_numbers ADD COLUMN purchase_item_id UUID;
        END IF;

        -- Then, add the foreign key constraint if it doesn't exist.
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='fk_serial_numbers_purchase_item' AND table_name='serial_numbers' AND table_schema='public'
        ) THEN
            ALTER TABLE public.serial_numbers
            ADD CONSTRAINT fk_serial_numbers_purchase_item
            FOREIGN KEY (purchase_item_id)
            REFERENCES public.purchase_order_items(id) ON DELETE SET NULL;

            COMMENT ON COLUMN public.serial_numbers.purchase_item_id IS 'Link to the purchase order item through which this serial entered stock.';
        END IF;
    END IF;
END $$;

-- Add FK from transaction_item_serials.purchase_order_item_id to purchase_order_items.id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_item_serials' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='transaction_item_serials' AND column_name='purchase_order_item_id' AND table_schema='public'
        ) THEN
            ALTER TABLE public.transaction_item_serials ADD COLUMN purchase_order_item_id UUID;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='fk_transaction_item_serials_po_item' AND table_name='transaction_item_serials' AND table_schema='public'
        ) THEN
            ALTER TABLE public.transaction_item_serials
            ADD CONSTRAINT fk_transaction_item_serials_po_item
            FOREIGN KEY (purchase_order_item_id)
            REFERENCES public.purchase_order_items(id) ON DELETE CASCADE;

            COMMENT ON COLUMN public.transaction_item_serials.purchase_order_item_id IS 'Link to an item on a purchase order receipt.';
        END IF;
    END IF;
END $$;

-- Update CHECK constraint on transaction_item_serials if it exists, to include purchase_order_item_id
-- This is complex to do idempotently, usually easier to drop and recreate if definition changes.
-- For now, assuming it was not created or will be manually adjusted if needed.
-- Example:
-- ALTER TABLE public.transaction_item_serials DROP CONSTRAINT IF EXISTS chk_transaction_item_presence;
-- ALTER TABLE public.transaction_item_serials
-- ADD CONSTRAINT chk_transaction_item_presence
-- CHECK (
--    COALESCE(invoice_item_id::text, purchase_order_item_id::text /*, other_item_ids... */) IS NOT NULL
-- );
-- Note: Casting to text for COALESCE is a common trick if types differ but all represent some ID.
-- If all FKs are UUID, direct COALESCE works. If they are BIGINT/UUID mixed, TEXT casting is safer for COALESCE.
-- Given invoice_item_id is BIGINT and purchase_order_item_id is UUID, this needs careful handling.
-- A better check might be (invoice_item_id IS NOT NULL AND purchase_order_item_id IS NULL ...) OR (invoice_item_id IS NULL AND purchase_order_item_id IS NOT NULL ...)
-- For now, leaving this specific constraint out of this auto-generated migration for simplicity. It can be added manually.
