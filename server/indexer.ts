import { store } from './store'

export interface IndexerConfig {
  rpcUrl: string
  treasuryAddress: string
  pollIntervalMs: number
}

export const DEFAULT_CONFIG: IndexerConfig = {
  rpcUrl: process.env.NIMIQ_RPC_URL || 'https://rpc.testnet.nimiqwatch.com/',
  treasuryAddress:
    process.env.TREASURY_ADDRESS || 'NQ80 TEAC H1TB ACK7 REAS URYT ESTN ETVA LADA',
  pollIntervalMs: 8000,
}

interface RpcTransaction {
  hash: string
  blockNumber: number
  timestamp: number
  from: string
  to: string
  value: number
  fee: number
  data?: string
  recipientData?: string
  senderData?: string
  executionResult?: boolean
}

// Clean address for comparison
function normalizeAddr(addr: string): string {
  return addr.replace(/\s+/g, '').toUpperCase()
}

// Decode raw hex or plain string data payload
function decodeDataPayload(raw?: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed.startsWith('back:')) {
    return trimmed
  }
  // Try decoding as hex
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    try {
      const decoded = Buffer.from(trimmed, 'hex').toString('utf8')
      if (decoded.startsWith('back:')) {
        return decoded
      }
    } catch {
      // Not valid UTF-8 hex
    }
  }
  return null
}

export class TreasuryIndexer {
  private config: IndexerConfig
  private isRunning: boolean = false
  private pollTimer: NodeJS.Timeout | null = null
  private lastIndexedTxHash: string | null = null

  constructor(config: Partial<IndexerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  public getTreasuryAddress(): string {
    return this.config.treasuryAddress
  }

  public getRpcUrl(): string {
    return this.config.rpcUrl
  }

  // Start polling the Nimiq network
  public start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log(`[Indexer] Started polling Nimiq Albatross RPC: ${this.config.rpcUrl}`)
    console.log(`[Indexer] Monitoring Treasury Address: ${this.config.treasuryAddress}`)

    const poll = async () => {
      if (!this.isRunning) return
      try {
        await this.pollOnce()
      } catch (err) {
        console.error('[Indexer] Error during polling cycle:', err)
      } finally {
        if (this.isRunning) {
          this.pollTimer = setTimeout(poll, this.config.pollIntervalMs)
        }
      }
    }

    poll()
  }

  public stop() {
    this.isRunning = false
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
    console.log('[Indexer] Stopped.')
  }

  // Single polling run
  public async pollOnce(): Promise<number> {
    const res = await fetch(this.config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getTransactionsByAddress',
        params: [this.config.treasuryAddress, 25, null],
        id: Date.now(),
      }),
    })

    if (!res.ok) {
      throw new Error(`RPC returned HTTP ${res.status}: ${res.statusText}`)
    }

    const json = (await res.json()) as {
      result?: { data?: RpcTransaction[] }
      error?: { code: number; message: string }
    }

    if (json.error) {
      throw new Error(`RPC Error ${json.error.code}: ${json.error.message}`)
    }

    const txs = json.result?.data || []
    let newTransactionsCount = 0

    for (const tx of txs) {
      const processed = await this.processTransaction(tx)
      if (processed) {
        newTransactionsCount++
      }
    }

    return newTransactionsCount
  }

  // Process and index an individual transaction
  public async processTransaction(tx: RpcTransaction): Promise<boolean> {
    const rawData = tx.recipientData || tx.data || tx.senderData
    const dataTag = decodeDataPayload(rawData)

    if (!dataTag) {
      // Transaction was not tagged for backing
      return false
    }

    // Check tag structure: back:{topicId}:{explainerId}
    const match = dataTag.match(/^back:([^:]+):([^:]+)$/)
    if (!match) {
      return false
    }

    const [, topicId, explainerId] = match

    // Check if explainer exists in DB / Supabase
    const explainer = await store.getExplainer(explainerId, topicId)

    if (!explainer) {
      console.warn(`[Indexer] Explainer ${explainerId} under topic ${topicId} not found. Skipping.`)
      return false
    }

    // Check if already indexed
    const existing = await store.getTransaction(tx.hash)

    if (existing) {
      return false
    }

    // Anti-Abuse Check: Self-Backing Detection
    const isSelfBacked = normalizeAddr(tx.from) === normalizeAddr(explainer.payout_address)

    // Insert transaction & update explainer totals via store
    await store.recordTransaction({
      tx_hash: tx.hash,
      topic_id: topicId,
      explainer_id: explainerId,
      sender_address: tx.from,
      recipient_address: tx.to,
      value_luna: tx.value,
      timestamp: tx.timestamp || Date.now(),
      block_number: tx.blockNumber || null,
      data_tag: dataTag,
      is_self_backed: isSelfBacked ? 1 : 0,
      indexed_at: Date.now(),
    })

    if (isSelfBacked) {
      console.warn(
        `[Indexer] ⚠️ Anti-Abuse: Self-backing detected from ${tx.from} for explainer ${explainerId}. Excluded from pool tally.`
      )
    } else {
      console.log(
        `[Indexer] ✅ Verified backing: +${tx.value / 100000} NIM for explainer ${explainerId} (Tx: ${tx.hash})`
      )
    }

    return true
  }
}
