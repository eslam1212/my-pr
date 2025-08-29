-- 1. Add reorder_level and preferred_stock_level to 'products' table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_stock_level INTEGER DEFAULT 0;

COMMENT ON COLUMN public.products.reorder_level IS 'General reorder point for the product. Alert when stock at or below this level across all locations if no specific level is set per location.';
COMMENT ON COLUMN public.products.preferred_stock_level IS 'General preferred stock level for the product. Used to suggest reorder quantity.';

-- Ensure new columns default to 0 if not specified, for existing rows they will be NULL without an UPDATE.
-- For new rows, DEFAULT 0 will apply. We might want to update existing NULLs to 0.
UPDATE public.products SET reorder_level = 0 WHERE reorder_level IS NULL;
UPDATE public.products SET preferred_stock_level = 0 WHERE preferred_stock_level IS NULL;

-- Make them NOT NULL now that existing NULLs are handled
ALTER TABLE public.products
ALTER COLUMN reorder_level SET NOT NULL,
ALTER COLUMN preferred_stock_level SET NOT NULL;


-- 2. Add reorder_level and preferred_stock_level to 'product_stock_levels' table
ALTER TABLE public.product_stock_levels
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_stock_level INTEGER DEFAULT 0;

COMMENT ON COLUMN public.product_stock_levels.reorder_level IS 'Location-specific reorder point for this product at this location. Overrides product''s general reorder_level.';
COMMENT ON COLUMN public.product_stock_levels.preferred_stock_level IS 'Location-specific preferred stock level for this product at this location. Overrides product''s general preferred_stock_level.';

-- Update existing NULLs to 0 for these new columns in product_stock_levels
UPDATE public.product_stock_levels SET reorder_level = 0 WHERE reorder_level IS NULL;
UPDATE public.product_stock_levels SET preferred_stock_level = 0 WHERE preferred_stock_level IS NULL;

-- Make them NOT NULL now that existing NULLs are handled
ALTER TABLE public.product_stock_levels
ALTER COLUMN reorder_level SET NOT NULL,
ALTER COLUMN preferred_stock_level SET NOT NULL;

-- No new triggers needed for these columns specifically, existing updated_at triggers on the tables are sufficient.
