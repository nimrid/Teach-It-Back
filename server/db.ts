import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'

const dataDir = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'teach_it_back.sqlite')
export const db = new DatabaseSync(dbPath)

// All 18 Curated Questions categorized by Difficulty
export const CURATED_TOPICS = [
  // 1. Simple
  {
    id: 'topic-simple-1',
    title: 'What is NIM and what can you do with it?',
    description: 'Explain the native currency of Nimiq, how it powers instant payments, and where it can be used.',
    difficulty: 'Simple',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-simple-2',
    title: "What's the difference between a Nimiq wallet and a regular bank account?",
    description: 'Explain self-custody, private keys, censorship resistance, and borderless transactions vs traditional banking.',
    difficulty: 'Simple',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-simple-3',
    title: "Why doesn't Nimiq need mining or expensive hardware?",
    description: 'Explain how Proof-of-Stake eliminated high electricity consumption and specialized ASIC mining rigs.',
    difficulty: 'Simple',
    rewardPoolLuna: 0,
  },

  // 2. Easy
  {
    id: 'topic-easy-1',
    title: "What does it mean that Nimiq runs 'directly in the browser'?",
    description: 'How Nimiq was built natively with JavaScript/WebAssembly and WebRTC to connect straight to the blockchain without middlemen.',
    difficulty: 'Easy',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-easy-2',
    title: 'What is staking, in plain terms — why would someone lock up their NIM?',
    description: 'Explain delegating stake to validators, earning protocol rewards, and securing network consensus.',
    difficulty: 'Easy',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-easy-3',
    title: "What's a Nimiq Pay Mini App, and how is it different from a normal app?",
    description: 'Explain WebViews with sandboxed provider injection (@nimiq/mini-app-sdk & window.ethereum) and zero private key exposure.',
    difficulty: 'Easy',
    rewardPoolLuna: 0,
  },

  // 3. Medium
  {
    id: 'topic-medium-1',
    title: 'What is Proof-of-Stake, and why did Nimiq move to it?',
    description: 'Trace the migration from PoW to Albatross PoS: dramatic speedups, energy efficiency, and validator economic incentives.',
    difficulty: 'Medium',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-medium-2',
    title: "What's the difference between a validator and a staker on Nimiq?",
    description: 'Distinguish between running node infrastructure/proposing blocks vs locking coins and delegating voting power.',
    difficulty: 'Medium',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-medium-3',
    title: 'Why can Nimiq confirm transactions in about a second?',
    description: 'Explain sub-second block production and optimistic consensus in the Albatross protocol.',
    difficulty: 'Medium',
    rewardPoolLuna: 0,
  },

  // 4. Medium-hard
  {
    id: 'topic-medhard-1',
    title: "What are micro blocks vs macro blocks in Nimiq's Albatross protocol, and what does each one do?",
    description: 'Detail the distinction: rapid micro blocks for throughput and transactional payload vs macro blocks for epoch finality and checkpointing.',
    difficulty: 'Medium-hard',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-medhard-2',
    title: 'What happens when a validator fails to produce a block on time (skip blocks)?',
    description: 'Explain the timeout mechanism, skip block creation, and how the network maintains liveness without stalling.',
    difficulty: 'Medium-hard',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-medhard-3',
    title: 'What gets slashed if a validator misbehaves, and why do stakers share that risk?',
    description: 'Cover double-signing, fork production, slashing penalties, and why stakers must choose trustworthy validators.',
    difficulty: 'Medium-hard',
    rewardPoolLuna: 0,
  },

  // 5. Hard
  {
    id: 'topic-hard-1',
    title: 'What are epochs and batches in Albatross, and why does the protocol organize time this way?',
    description: 'Break down how batches and epochs structure validator rotation, reward distribution, and finality checkpoints.',
    difficulty: 'Hard',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-hard-2',
    title: 'Explain the two-step voting process for a macro block (Tendermint-based BFT) — what is each step for?',
    description: 'Detail the pre-vote and pre-commit phases, quorum thresholds, and how safety is guaranteed against equivocation.',
    difficulty: 'Hard',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-hard-3',
    title: 'What is the 3f+1 Byzantine fault tolerance assumption, and what does it actually guarantee?',
    description: 'Explain mathematical BFT limits: why the protocol tolerates up to one-third malicious validators and guarantees safety and liveness.',
    difficulty: 'Hard',
    rewardPoolLuna: 0,
  },

  // 6. Expert
  {
    id: 'topic-expert-1',
    title: 'How does an election macro block select the next validator set, and why does that matter for decentralization?',
    description: 'Explore the VRF / randomness generation, stake-weighted selection algorithm, and Sybil resistance in validator elections.',
    difficulty: 'Expert',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-expert-2',
    title: 'Explain how zero-knowledge proofs (Arkworks/Groth16) are used inside Albatross, and what problem they solve.',
    description: 'Analyze SNARKs for recursive epoch compression, enabling ultra-light mobile clients to verify consensus in milliseconds.',
    difficulty: 'Expert',
    rewardPoolLuna: 0,
  },
  {
    id: 'topic-expert-3',
    title: "What's the actual trade-off Albatross makes to hit 1000+ TPS with sub-second finality that other PoS chains don't make?",
    description: 'Critique the architectural compromises: optimistic pipeline, validator set sizing, communication overhead, and state storage.',
    difficulty: 'Expert',
    rewardPoolLuna: 0,
  },
]

// Initialize Schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Easy',
      round_status TEXT NOT NULL DEFAULT 'open',
      round_end_timestamp INTEGER NOT NULL,
      reward_pool_luna INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS explainers (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'video',
      video_url TEXT,
      content_url TEXT,
      content_text TEXT,
      payout_address TEXT NOT NULL,
      total_backed_luna INTEGER DEFAULT 0,
      backer_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics (id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      tx_hash TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      explainer_id TEXT NOT NULL,
      sender_address TEXT NOT NULL,
      recipient_address TEXT NOT NULL,
      value_luna INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      block_number INTEGER,
      data_tag TEXT NOT NULL,
      is_self_backed INTEGER DEFAULT 0,
      indexed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT NOT NULL,
      explainer_id TEXT NOT NULL,
      payout_address TEXT NOT NULL,
      amount_luna INTEGER NOT NULL,
      proportional_percent REAL NOT NULL,
      tx_hash TEXT,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `)

  // Migrations
  try {
    db.exec("ALTER TABLE topics ADD COLUMN difficulty TEXT DEFAULT 'Easy'")
  } catch {}
  try {
    db.exec("ALTER TABLE explainers ADD COLUMN content_type TEXT DEFAULT 'video'")
  } catch {}
  try {
    db.exec('ALTER TABLE explainers ADD COLUMN content_url TEXT')
  } catch {}
  try {
    db.exec('ALTER TABLE explainers ADD COLUMN content_text TEXT')
  } catch {}
  try {
    db.exec('UPDATE explainers SET content_url = video_url WHERE content_url IS NULL AND video_url IS NOT NULL')
  } catch {}

  // Upsert the 18 Curated Questions without overwriting community-backed pool totals
  const upsertTopic = db.prepare(`
    INSERT INTO topics (id, title, description, difficulty, round_status, round_end_timestamp, reward_pool_luna)
    VALUES (?, ?, ?, ?, 'open', ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      difficulty = excluded.difficulty
  `)

  for (const t of CURATED_TOPICS) {
    upsertTopic.run(
      t.id,
      t.title,
      t.description,
      t.difficulty,
      Date.now() + 1000 * 60 * 60 * 72 // 72 hours
    )
  }

  // Recalculate each topic's community pool from actual user backings (removes legacy pre-seeded bounties)
  try {
    db.exec(`
      UPDATE topics SET reward_pool_luna = (
        SELECT COALESCE(SUM(total_backed_luna), 0)
        FROM explainers
        WHERE explainers.topic_id = topics.id
      )
    `)
  } catch {}
}

