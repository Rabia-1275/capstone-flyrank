-- Migration: Create ai_usage table for tracking usage caps
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('analyze', 'generate', 'score')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient per-user quota lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_kind_created
  ON ai_usage (user_id, kind, created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Allow select own usage"
  ON ai_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow insert own usage"
  ON ai_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
