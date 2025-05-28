-- Ensure the uuid-ossp extension is enabled to use uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create 'storage_locations' table
CREATE TABLE IF NOT EXISTS public.storage_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.storage_locations IS 'Stores information about different storage locations for inventory.';
COMMENT ON COLUMN public.storage_locations.is_default IS 'Indicates if this is the default location for new stock. Only one can be true.';

-- Apply trigger for 'updated_at' on 'storage_locations'
-- (Assuming trigger_set_timestamp function already exists from previous migrations)
DROP TRIGGER IF EXISTS set_timestamp_storage_locations_updated_at ON public.storage_locations; -- Drop if exists from previous attempt with BIGSERIAL
CREATE TRIGGER set_timestamp_storage_locations_updated_at
BEFORE UPDATE ON public.storage_locations
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Trigger function to ensure only one default location
CREATE OR REPLACE FUNCTION public.ensure_single_default_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE public.storage_locations
        SET is_default = FALSE
        WHERE id != NEW.id AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_location ON public.storage_locations;
CREATE TRIGGER trigger_ensure_single_default_location
BEFORE INSERT OR UPDATE OF is_default ON public.storage_locations
FOR EACH ROW
WHEN (NEW.is_default = TRUE) -- Only run the trigger if is_default is being set to TRUE
EXECUTE FUNCTION public.ensure_single_default_location();


-- 2. Modify 'serial_numbers' table to add 'location_id'
-- Drop the old column if it was BIGINT from a previous incorrect run of this migration part
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'serial_numbers'
        AND column_name = 'location_id'
        -- AND data_type = 'bigint' -- Or check udt_name if data_type is not precise enough
    )
    AND NOT EXISTS ( -- Check if it's already UUID to avoid error if script is re-run correctly
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'serial_numbers'
        AND column_name = 'location_id'
        AND (udt_name = 'uuid' OR data_type = 'uuid')
    )
    THEN
        ALTER TABLE public.serial_numbers DROP COLUMN location_id;
    END IF;
END $$;

ALTER TABLE public.serial_numbers
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.serial_numbers.location_id IS 'Current storage location of this specific serial number unit.';
DROP INDEX IF EXISTS idx_serial_numbers_location_id; -- Drop if exists from previous attempt
CREATE INDEX IF NOT EXISTS idx_serial_numbers_location_id ON public.serial_numbers(location_id);


-- 3. Create 'product_stock_levels' table
-- Drop table if it exists from a previous incorrect run (e.g. with location_id as BIGINT)
-- This is safer for re-runs during development if the PK structure changed.
DO $$
DECLARE
    col_type_location TEXT;
BEGIN
    SELECT data_type INTO col_type_location
    FROM information_schema.columns
    WHERE table_name = 'product_stock_levels' AND column_name = 'location_id' AND table_schema = 'public';

    IF FOUND AND col_type_location != 'uuid' THEN
        DROP TABLE public.product_stock_levels;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.product_stock_levels (
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, -- products.id is BIGINT
    location_id UUID NOT NULL REFERENCES public.storage_locations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (product_id, location_id)
);

COMMENT ON TABLE public.product_stock_levels IS 'Tracks stock quantities of non-serial-tracked products per location.';
COMMENT ON COLUMN public.product_stock_levels.quantity IS 'Quantity of the product at this specific location.';

-- Apply trigger for 'updated_at' on 'product_stock_levels'
DROP TRIGGER IF EXISTS set_timestamp_product_stock_levels_updated_at ON public.product_stock_levels;
CREATE TRIGGER set_timestamp_product_stock_levels_updated_at
BEFORE UPDATE ON public.product_stock_levels
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Indexes for performance
DROP INDEX IF EXISTS idx_product_stock_levels_product_id;
DROP INDEX IF EXISTS idx_product_stock_levels_location_id;
CREATE INDEX IF NOT EXISTS idx_product_stock_levels_product_id ON public.product_stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_levels_location_id ON public.product_stock_levels(location_id);

-- Seed a default storage location if none exists
INSERT INTO public.storage_locations (name, description, is_default)
SELECT 'المخزن الرئيسي', 'الموقع الافتراضي للمخزون', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.storage_locations WHERE is_default = TRUE);
