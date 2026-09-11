import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { CURATED_TOPICS } from './db'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

export interface TopicRow {
  id: string
  title: string
  description: string
  difficulty: string
  round_status: string
  round_end_timestamp: number
  reward_pool_luna: number
}

export interface ExplainerRow {
  id: string
  topic_id: string
  teacher_name: string
  content_type: string
  video_url: string | null
  content_url: string | null
  content_text: string | null
  payout_address: string
  total_backed_luna: number
  backer_count: number
  created_at: number
}

export interface TransactionRow {
  tx_hash: string
  topic_id: string
  explainer_id: string
  sender_address: string
  recipient_address: string
  value_luna: number
  timestamp: number
  block_number: number | null
  data_tag: string
  is_self_backed: number
  indexed_at: number
}

export interface PayoutRow {
  id?: number
  topic_id: string
  explainer_id: string
  payout_address: string
  amount_luna: number
  proportional_percent: number
  tx_hash: string
  status: string
  created_at: number
}

let isReady = false

export async function initSupabase(): Promise<boolean> {
  if (!supabase) {
    console.log('[Supabase] Credentials not configured. Running with local storage.')
    return false
  }

  try {
    const { data, error } = await supabase.from('topics').select('id').limit(1)

    if (error) {
      console.warn(
        '[Supabase] Table "topics" is not accessible yet:',
        error.message,
        '\n👉 To enable Supabase persistence on Render Free Plan, run the SQL script in supabase/schema.sql in your Supabase SQL Editor.'
      )
      isReady = false
      return false
    }

    isReady = true
    console.log('[Supabase] Connected successfully! Cloud persistence active.')

    // Seed 18 topics if Supabase table is empty
    const { count } = await supabase.from('topics').select('*', { count: 'exact', head: true })
    if (count === 0) {
      console.log('[Supabase] Seeding 18 curated questions to Supabase...')
      const now = Date.now()
      const seedTopics: TopicRow[] = CURATED_TOPICS.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        round_status: 'open',
        round_end_timestamp: now + 1000 * 60 * 60 * 72,
        reward_pool_luna: t.rewardPoolLuna,
      }))
      await supabase.from('topics').upsert(seedTopics)
      console.log('[Supabase] 18 curated questions seeded into Supabase.')
    }

    return true
  } catch (err) {
    console.warn('[Supabase] Initialization check error:', err)
    isReady = false
    return false
  }
}

export function isSupabaseActive(): boolean {
  return isReady && supabase !== null
}
