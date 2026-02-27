-- Create bookings table for Time-With-A-Rex
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  photo_url TEXT,
  location TEXT NOT NULL,
  height_ok BOOLEAN NOT NULL,
  duration INTEGER NOT NULL,
  music_choice TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  on_call_availability TEXT,
  age_verified BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for checking booking conflicts
CREATE INDEX idx_bookings_date_time ON bookings(booking_date, booking_time);

-- Create index for email lookups
CREATE INDEX idx_bookings_email ON bookings(email);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anonymous users (for public booking form)
CREATE POLICY "Allow public inserts" ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reads for checking availability (public)
CREATE POLICY "Allow public reads for availability" ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);
