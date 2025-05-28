-- Ensure the uuid-ossp extension is enabled if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create inventory_adjustments_type ENUM if strict types are desired, otherwise TEXT is fine.
-- CREATE TYPE public.inventory_adjustment_type AS ENUM (
--     'initial_stock',
--     'cycle_count',
--     'physical_count',
--     'damage',
--     'theft',
--     'correction_increase',
--     'correction_decrease',
--     'purchase_receipt', -- For non-serial items received via purchase
--     'sale_dispatch',    -- For non-serial items dispatched via sale
--     'stock_transfer_out',
--     'stock_transfer_in',
--     'other'
-- );

CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.storage_locations(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    
    counted_quantity INTEGER NOT NULL, -- Actual quantity found/counted
    expected_quantity INTEGER NOT NULL, -- System quantity before this adjustment/count
    variance INTEGER NOT NULL, -- Should be (counted_quantity - expected_quantity) for counts, or the adjustment amount itself
    
    -- adjustment_type public.inventory_adjustment_type NOT NULL,
    adjustment_type TEXT NOT NULL, -- Using TEXT for flexibility for now
    
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who initiated/counted
    
    counted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    is_processed BOOLEAN DEFAULT FALSE NOT NULL,
    processed_at TIMESTAMPTZ,
    processed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who processed the adjustment

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.inventory_adjustments IS 'Records results of stock counts and inventory adjustments.';
COMMENT ON COLUMN public.inventory_adjustments.location_id IS 'Location where the count/adjustment occurred.';
COMMENT ON COLUMN public.inventory_adjustments.product_id IS 'Product being counted/adjusted.';
COMMENT ON COLUMN public.inventory_adjustments.counted_quantity IS 'Actual quantity counted or the target quantity after adjustment.';
COMMENT ON COLUMN public.inventory_adjustments.expected_quantity IS 'System quantity recorded before this count/adjustment.';
COMMENT ON COLUMN public.inventory_adjustments.variance IS 'Difference: (counted_quantity - expected_quantity) for counts, or the direct adjustment amount.';
COMMENT ON COLUMN public.inventory_adjustments.adjustment_type IS 'Type of inventory adjustment or count event.';
COMMENT ON COLUMN public.inventory_adjustments.user_id IS 'User who performed the count or initiated the adjustment.';
COMMENT ON COLUMN public.inventory_adjustments.counted_at IS 'Timestamp of when the count/adjustment was made.';
COMMENT ON COLUMN public.inventory_adjustments.is_processed IS 'True if this adjustment has updated the main stock levels.';
COMMENT ON COLUMN public.inventory_adjustments.processed_at IS 'Timestamp of when the adjustment was processed into stock levels.';
COMMENT ON COLUMN public.inventory_adjustments.processed_by_user_id IS 'User who processed the adjustment.';

-- Apply trigger for 'updated_at'
-- (Assuming trigger_set_timestamp function already exists from previous migrations)
CREATE TRIGGER set_timestamp_inventory_adjustments_updated_at
BEFORE UPDATE ON public.inventory_adjustments
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_location_id ON public.inventory_adjustments(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON public.inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_adjustment_type ON public.inventory_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_is_processed ON public.inventory_adjustments(is_processed);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_counted_at ON public.inventory_adjustments(counted_at);
