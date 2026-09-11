-- =========================================================
-- Teach It Back: Supabase PostgreSQL Schema
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- =========================================================

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Easy',
  round_status TEXT NOT NULL DEFAULT 'open',
  round_end_timestamp BIGINT NOT NULL,
  reward_pool_luna BIGINT NOT NULL
);

-- 2. Explainers Table
CREATE TABLE IF NOT EXISTS public.explainers (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES public.topics (id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'video',
  video_url TEXT,
  content_url TEXT,
  content_text TEXT,
  payout_address TEXT NOT NULL,
  total_backed_luna BIGINT NOT NULL DEFAULT 0,
  backer_count INT NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  tx_hash TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  explainer_id TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  value_luna BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  block_number BIGINT,
  data_tag TEXT NOT NULL,
  is_self_backed INT NOT NULL DEFAULT 0,
  indexed_at BIGINT NOT NULL
);

-- 4. Payouts Table
CREATE TABLE IF NOT EXISTS public.payouts (
  id BIGSERIAL PRIMARY KEY,
  topic_id TEXT NOT NULL,
  explainer_id TEXT NOT NULL,
  payout_address TEXT NOT NULL,
  amount_luna BIGINT NOT NULL,
  proportional_percent NUMERIC NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access (Anyone can read topics, explainers, transactions, payouts)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read topics') THEN
    CREATE POLICY "Allow public read topics" ON public.topics FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read explainers') THEN
    CREATE POLICY "Allow public read explainers" ON public.explainers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read transactions') THEN
    CREATE POLICY "Allow public read transactions" ON public.transactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read payouts') THEN
    CREATE POLICY "Allow public read payouts" ON public.payouts FOR SELECT USING (true);
  END IF;
END $$;

-- Allow Service Role Full Access for the backend
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role full access to topics') THEN
    CREATE POLICY "Allow service_role full access to topics" ON public.topics USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role full access to explainers') THEN
    CREATE POLICY "Allow service_role full access to explainers" ON public.explainers USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role full access to transactions') THEN
    CREATE POLICY "Allow service_role full access to transactions" ON public.transactions USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role full access to payouts') THEN
    CREATE POLICY "Allow service_role full access to payouts" ON public.payouts USING (true) WITH CHECK (true);
  END IF;
END $$;
