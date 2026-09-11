import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import { initDatabase, db } from './db'
import { TreasuryIndexer, DEFAULT_CONFIG } from './indexer'
import { ValidationUtils } from '@nimiq/utils/validation-utils'
import { AddressBook } from '@nimiq/utils/address-book'
import { initSupabase } from './supabase'
import { store } from './store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'tib-testnet-admin-secret'

// Trust proxy for secure headers and reverse proxies (Fly.io, Render, Railway, Cloudflare)
app.set('trust proxy', 1)

app.use(cors())
app.use(express.json())

// General API rate limiter (180 req / min)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
})
app.use('/api', apiLimiter)

// Explainer submission rate limiter (15 submissions / 10 mins per IP)
const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Submission rate limit reached. Please wait a few minutes before posting again.' },
})

// Admin Authentication Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization
  const queryKey = req.query.apiKey as string | undefined
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

  if (bearerToken === ADMIN_API_KEY || queryKey === ADMIN_API_KEY) {
    return next()
  }

  return res.status(401).json({
    error: 'Unauthorized: Valid ADMIN_API_KEY required in Authorization header or apiKey parameter.',
  })
}

// Initialize Local SQLite Database Schema
initDatabase()

// Initialize Supabase Cloud Persistence (Render Free Tier diskless support)
initSupabase().catch((err) => console.warn('[Supabase] Init error:', err))

// Initialize & Start Indexer (defaults to Nimiq Testnet)
const indexer = new TreasuryIndexer()
indexer.start()

// 1. Topics Endpoint
app.get('/api/topics', async (_req: Request, res: Response) => {
  const topics = await store.getTopics()
  res.json({ topics })
})

// 2. Explainers Endpoint
app.get('/api/explainers', async (req: Request, res: Response) => {
  const topicId = req.query.topicId as string | undefined
  const explainers = await store.getExplainers(topicId)
  res.json({ explainers })
})

// 3. Submit New Explainer (Supports Video, Blog/Writeup Link, or Direct Text)
app.post('/api/explainers', submissionLimiter, async (req: Request, res: Response): Promise<any> => {
  const { topicId, teacherName, payoutAddress, contentType = 'video', contentUrl, contentText } = req.body

  if (!topicId || !teacherName || !payoutAddress) {
    return res.status(400).json({ error: 'Missing required fields: topicId, teacherName, and payoutAddress are mandatory.' })
  }

  const validTypes = ['video', 'article', 'text']
  if (!validTypes.includes(contentType)) {
    return res.status(400).json({ error: 'contentType must be "video", "article", or "text".' })
  }

  if (contentType === 'text') {
    if (!contentText || contentText.trim().length < 20) {
      return res.status(400).json({ error: 'Direct text explainers must be at least 20 characters long.' })
    }
  } else {
    if (!contentUrl || !contentUrl.trim().startsWith('http')) {
      return res.status(400).json({ error: 'A valid http(s) URL is required for video and article explainers.' })
    }
  }

  // Validate Nimiq Payout Address Checksum
  const cleanAddress = payoutAddress.trim()
  if (!ValidationUtils.isValidAddress(cleanAddress)) {
    return res.status(400).json({
      error: 'Invalid Nimiq payout address format or checksum. Please verify your address in Nimiq Pay.',
    })
  }

  // Check AddressBook Label
  const label = AddressBook.getLabel(cleanAddress)

  // Verify Topic exists
  const topic = await store.getTopic(topicId)
  if (!topic) {
    return res.status(404).json({ error: `Topic with ID "${topicId}" does not exist.` })
  }

  const id = `exp-${Date.now()}`
  const createdAt = Date.now()
  const finalUrl = contentUrl ? contentUrl.trim() : ''
  const finalText = contentText ? contentText.trim() : null

  const newExplainer = {
    id,
    topic_id: topicId,
    teacher_name: teacherName.trim(),
    content_type: contentType,
    video_url: finalUrl,
    content_url: finalUrl || null,
    content_text: finalText,
    payout_address: cleanAddress,
    total_backed_luna: 0,
    backer_count: 0,
    created_at: createdAt,
  }

  await store.createExplainer(newExplainer)

  return res.status(201).json({
    explainer: newExplainer,
    addressLabel: label,
  })
})

// 4. Leaderboard Endpoint
app.get('/api/leaderboard', (_req: Request, res: Response) => {
  const rows = db
    .prepare(`
      SELECT id, teacher_name, payout_address, total_backed_luna, backer_count
      FROM explainers
      ORDER BY total_backed_luna DESC
    `)
    .all() as Array<{
    id: string
    teacher_name: string
    payout_address: string
    total_backed_luna: number
    backer_count: number
  }>

  const leaderboard = rows.map((r, index) => ({
    ...r,
    rank: index + 1,
  }))

  res.json({ leaderboard })
})

// 5. Treasury Status & Transactions
app.get('/api/treasury', (_req: Request, res: Response) => {
  const txCount = (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as { c: number }).c
  const totalLuna = (
    db
      .prepare('SELECT COALESCE(SUM(value_luna), 0) as s FROM transactions WHERE is_self_backed = 0')
      .get() as { s: number }
  ).s

  const recentTxs = db
    .prepare('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 20')
    .all()

  res.json({
    treasuryAddress: indexer.getTreasuryAddress(),
    rpcUrl: indexer.getRpcUrl(),
    totalTransactions: txCount,
    totalIndexedLuna: totalLuna,
    recentTransactions: recentTxs,
  })
})

// 6. Round Close & Payout Computation (Admin Trigger)
app.post('/api/admin/close-round', requireAdmin, async (req: Request, res: Response): Promise<any> => {
  const { topicId } = req.body

  if (!topicId) {
    return res.status(400).json({ error: 'topicId is required to close a round.' })
  }

  const topic = await store.getTopic(topicId)

  if (!topic) {
    return res.status(404).json({ error: 'Topic not found.' })
  }

  // Get eligible explainers
  const explainers = await store.getExplainers(topicId)

  const totalTopicBacking = explainers.reduce((acc, e) => acc + Number(e.total_backed_luna), 0)
  const payouts: Array<{
    explainerId: string
    teacherName: string
    payoutAddress: string
    amountLuna: number
    percent: number
    txHash: string
  }> = []

  // Close the topic round
  await store.closeRound(topicId)

  // Compute proportional payouts
  for (const exp of explainers) {
    let share = 0
    let amount = 0
    if (totalTopicBacking > 0) {
      share = Number(exp.total_backed_luna) / totalTopicBacking
      amount = Math.floor(topic.reward_pool_luna * share)
    }

    const simulatedHash = `payout_tx_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`

    await store.recordPayout({
      topic_id: topicId,
      explainer_id: exp.id,
      payout_address: exp.payout_address,
      amount_luna: amount,
      proportional_percent: share * 100,
      tx_hash: simulatedHash,
      status: 'simulated',
      created_at: Date.now(),
    })

    payouts.push({
      explainerId: exp.id,
      teacherName: exp.teacher_name,
      payoutAddress: exp.payout_address,
      amountLuna: amount,
      percent: Math.round(share * 1000) / 10,
      txHash: simulatedHash,
    })
  }

  return res.json({
    message: `Round for topic "${topic.title}" closed successfully.`,
    rewardPoolLuna: topic.reward_pool_luna,
    totalBackingLuna: totalTopicBacking,
    payouts,
  })
})

// Dev simulation endpoint (for testing without on-chain transactions)
app.post('/api/dev/simulate-backing', async (req: Request, res: Response): Promise<any> => {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_SIMULATION) {
    return res.status(403).json({ error: 'Dev simulation endpoint is disabled in production.' })
  }

  const { topicId, explainerId, fromAddress, valueLuna } = req.body

  if (!topicId || !explainerId || !fromAddress || !valueLuna) {
    return res.status(400).json({ error: 'Missing required parameters.' })
  }

  const txHash = `mock_tx_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`
  const processed = await indexer.processTransaction({
    hash: txHash,
    blockNumber: 11114500,
    timestamp: Date.now(),
    from: fromAddress,
    to: indexer.getTreasuryAddress(),
    value: Number(valueLuna),
    fee: 0,
    recipientData: `back:${topicId}:${explainerId}`,
  })

  return res.json({
    success: processed,
    txHash,
  })
})

// Serve static frontend bundle in production
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

// Frontend SPA fallback for any unhandled routes (Express 5 compatible)
app.use((_req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html')
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Teach It Back</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1>Teach It Back API Server</h1>
            <p>API is active. Build the frontend with <code>pnpm build</code> to serve the full app here.</p>
          </body>
        </html>
      `)
    }
  })
})

// Start HTTP server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Teach It Back running on http://0.0.0.0:${PORT}`)
})

process.on('SIGTERM', () => {
  indexer.stop()
  server.close()
})
