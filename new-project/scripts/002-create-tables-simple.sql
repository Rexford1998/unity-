-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  format TEXT NOT NULL,
  platform TEXT NOT NULL,
  style TEXT,
  status TEXT DEFAULT 'GENERATING' NOT NULL,
  file_url TEXT,
  thumbnail_url TEXT,
  polygon_count INTEGER,
  texture_resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  albedo_url TEXT,
  normal_url TEXT,
  roughness_url TEXT,
  metallic_url TEXT,
  status TEXT DEFAULT 'GENERATING' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
