import { db, CURATED_TOPICS } from './db'
import { supabase, isSupabaseActive, TopicRow, ExplainerRow, TransactionRow, PayoutRow } from './supabase'

export const store = {
  // 1. Get all topics
  async getTopics(): Promise<TopicRow[]> {
    if (isSupabaseActive() && supabase) {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('reward_pool_luna', { ascending: true })
      if (!error && data) return data as TopicRow[]
    }
    return db.prepare('SELECT * FROM topics').all() as TopicRow[]
  },

  // 2. Get single topic by ID
  async getTopic(id: string): Promise<TopicRow | null> {
    if (isSupabaseActive() && supabase) {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (!error && data) return data as TopicRow
    }
    const row = db.prepare('SELECT * FROM topics WHERE id = ?').get(id)
    return (row as TopicRow) || null
  },

  // 3. Get explainers (optionally filtered by topicId)
  async getExplainers(topicId?: string): Promise<ExplainerRow[]> {
    if (isSupabaseActive() && supabase) {
      let query = supabase.from('explainers').select('*').order('total_backed_luna', { ascending: false })
      if (topicId) {
        query = query.eq('topic_id', topicId)
      }
      const { data, error } = await query
      if (!error && data) return data as ExplainerRow[]
    }

    if (topicId) {
      return db
        .prepare('SELECT * FROM explainers WHERE topic_id = ? ORDER BY total_backed_luna DESC')
        .all(topicId) as ExplainerRow[]
    }
    return db.prepare('SELECT * FROM explainers ORDER BY total_backed_luna DESC').all() as ExplainerRow[]
  },

  // 4. Get single explainer by ID
  async getExplainer(id: string, topicId?: string): Promise<ExplainerRow | null> {
    if (isSupabaseActive() && supabase) {
      let query = supabase.from('explainers').select('*').eq('id', id)
      if (topicId) query = query.eq('topic_id', topicId)
      const { data, error } = await query.maybeSingle()
      if (!error && data) return data as ExplainerRow
    }

    if (topicId) {
      const row = db.prepare('SELECT * FROM explainers WHERE id = ? AND topic_id = ?').get(id, topicId)
      return (row as ExplainerRow) || null
    }
    const row = db.prepare('SELECT * FROM explainers WHERE id = ?').get(id)
    return (row as ExplainerRow) || null
  },

  // 5. Create new explainer
  async createExplainer(row: ExplainerRow): Promise<void> {
    // Write to SQLite
    db.prepare(`
      INSERT INTO explainers (
        id, topic_id, teacher_name, content_type, video_url, content_url, content_text,
        payout_address, total_backed_luna, backer_count, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id,
      row.topic_id,
      row.teacher_name,
      row.content_type,
      row.video_url,
      row.content_url,
      row.content_text,
      row.payout_address,
      row.total_backed_luna,
      row.backer_count,
      row.created_at
    )

    // Write to Supabase if active
    if (isSupabaseActive() && supabase) {
      const { error } = await supabase.from('explainers').insert(row)
      if (error) {
        console.error('[Supabase] Error inserting explainer:', error.message)
      }
    }
  },

  // 6. Check if transaction already indexed
  async getTransaction(txHash: string): Promise<TransactionRow | null> {
    if (isSupabaseActive() && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tx_hash', txHash)
        .maybeSingle()
      if (!error && data) return data as TransactionRow
    }

    const row = db.prepare('SELECT tx_hash FROM transactions WHERE tx_hash = ?').get(txHash)
    return (row as TransactionRow) || null
  },

  // 7. Record transaction and credit explainer
  async recordTransaction(tx: TransactionRow): Promise<void> {
    // Record in SQLite
    db.prepare(`
      INSERT INTO transactions (
        tx_hash, topic_id, explainer_id, sender_address, recipient_address,
        value_luna, timestamp, block_number, data_tag, is_self_backed, indexed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tx.tx_hash,
      tx.topic_id,
      tx.explainer_id,
      tx.sender_address,
      tx.recipient_address,
      tx.value_luna,
      tx.timestamp,
      tx.block_number,
      tx.data_tag,
      tx.is_self_backed,
      tx.indexed_at
    )

    if (!tx.is_self_backed) {
      db.prepare(`
        UPDATE explainers
        SET total_backed_luna = total_backed_luna + ?,
            backer_count = backer_count + 1
        WHERE id = ?
      `).run(tx.value_luna, tx.explainer_id)
    }

    // Record in Supabase
    if (isSupabaseActive() && supabase) {
      const { error: txErr } = await supabase.from('transactions').insert(tx)
      if (txErr) console.error('[Supabase] Error saving transaction:', txErr.message)

      if (!tx.is_self_backed) {
        const explainer = await this.getExplainer(tx.explainer_id)
        if (explainer) {
          await supabase
            .from('explainers')
            .update({
              total_backed_luna: Number(explainer.total_backed_luna) + tx.value_luna,
              backer_count: Number(explainer.backer_count) + 1,
            })
            .eq('id', tx.explainer_id)
        }
      }
    }
  },

  // 8. Close topic round
  async closeRound(topicId: string): Promise<void> {
    db.prepare('UPDATE topics SET round_status = ? WHERE id = ?').run('closed', topicId)

    if (isSupabaseActive() && supabase) {
      await supabase.from('topics').update({ round_status: 'closed' }).eq('id', topicId)
    }
  },

  // 9. Record payout
  async recordPayout(payout: PayoutRow): Promise<void> {
    db.prepare(`
      INSERT INTO payouts (topic_id, explainer_id, payout_address, amount_luna, proportional_percent, tx_hash, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payout.topic_id,
      payout.explainer_id,
      payout.payout_address,
      payout.amount_luna,
      payout.proportional_percent,
      payout.tx_hash,
      payout.status,
      payout.created_at
    )

    if (isSupabaseActive() && supabase) {
      await supabase.from('payouts').insert(payout)
    }
  },
}
