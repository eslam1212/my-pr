-- Add SELECT policy for products table
CREATE POLICY "Enable select for authenticated users" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL); 