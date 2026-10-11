-- Migration: Add default_tone and default_length to profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS default_tone TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS default_length TEXT DEFAULT 'medium';

-- Optional comments for schema clarity
COMMENT ON COLUMN profiles.default_tone IS 'Default tone for generated proposals (professional, friendly, confident, concise)';
COMMENT ON COLUMN profiles.default_length IS 'Default length for generated proposals (short, medium, long)';
