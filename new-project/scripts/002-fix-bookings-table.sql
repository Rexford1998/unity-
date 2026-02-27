-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public inserts" ON bookings;
DROP POLICY IF EXISTS "Allow public reads for availability" ON bookings;

-- Recreate policies to ensure they work
CREATE POLICY "Allow public inserts" ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public reads for availability" ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow updates for status changes
CREATE POLICY "Allow public updates" ON bookings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
