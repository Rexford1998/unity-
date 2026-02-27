-- MeshForge AI Database Schema

-- Create enum for asset status
CREATE TYPE asset_status AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

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
  status asset_status DEFAULT 'GENERATING' NOT NULL,
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
  status asset_status DEFAULT 'GENERATING' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true);

-- RLS Policies for assets
CREATE POLICY "Anyone can view assets" ON assets
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert assets" ON assets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update assets" ON assets
  FOR UPDATE USING (true);

-- RLS Policies for materials
CREATE POLICY "Anyone can view materials" ON materials
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert materials" ON materials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update materials" ON materials
  FOR UPDATE USING (true);
