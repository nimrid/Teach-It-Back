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
  // 1. Simple (50 NIM Pool)
  {
    id: 'topic-simple-1',
    title: 'What is NIM and what can you do with it?',
    description: 'Explain the native currency of Nimiq, how it powers instant payments, and where it can be used.',
    difficulty: 'Simple',
    rewardPoolLuna: 5_000_000,
  },
  {
    id: 'topic-simple-2',
    title: "What's the difference between a Nimiq wallet and a regular bank account?",
    description: 'Explain self-custody, private keys, censorship resistance, and borderless transactions vs traditional banking.',
    difficulty: 'Simple',
    rewardPoolLuna: 5_000_000,
  },
  {
    id: 'topic-simple-3',
    title: "Why doesn't Nimiq need mining or expensive hardware?",
    description: 'Explain how Proof-of-Stake eliminated high electricity consumption and specialized ASIC mining rigs.',
    difficulty: 'Simple',
    rewardPoolLuna: 5_000_000,
  },

  // 2. Easy (100 NIM Pool)
  {
    id: 'topic-easy-1',
    title: "What does it mean that Nimiq runs 'directly in the browser'?",
    description: 'How Nimiq was built natively with JavaScript/WebAssembly and WebRTC to connect straight to the blockchain without middlemen.',
    difficulty: 'Easy',
    rewardPoolLuna: 10_000_000,
  },
  {
    id: 'topic-easy-2',
    title: 'What is staking, in plain terms — why would someone lock up their NIM?',
    description: 'Explain delegating stake to validators, earning protocol rewards, and securing network consensus.',
    difficulty: 'Easy',
    rewardPoolLuna: 10_000_000,
  },
  {
    id: 'topic-easy-3',
    title: "What's a Nimiq Pay Mini App, and how is it different from a normal app?",
    description: 'Explain WebViews with sandboxed provider injection (@nimiq/mini-app-sdk & window.ethereum) and zero private key exposure.',
    difficulty: 'Easy',
    rewardPoolLuna: 10_000_000,
  },

  // 3. Medium (150 NIM Pool)
  {
    id: 'topic-medium-1',
    title: 'What is Proof-of-Stake, and why did Nimiq move to it?',
    description: 'Trace the migration from PoW to Albatross PoS: dramatic speedups, energy efficiency, and validator economic incentives.',
    difficulty: 'Medium',
    rewardPoolLuna: 15_000_000,
  },
  {
    id: 'topic-medium-2',
    title: "What's the difference between a validator and a staker on Nimiq?",
    description: 'Distinguish between running node infrastructure/proposing blocks vs locking coins and delegating voting power.',
    difficulty: 'Medium',
    rewardPoolLuna: 15_000_000,
  },
  {
    id: 'topic-medium-3',
    title: 'Why can Nimiq confirm transactions in about a second?',
    description: 'Explain sub-second block production and optimistic consensus in the Albatross protocol.',
    difficulty: 'Medium',
    rewardPoolLuna: 15_000_000,
  },

  // 4. Medium-hard (250 NIM Pool)
  {
    id: 'topic-medhard-1',
    title: "What are micro blocks vs macro blocks in Nimiq's Albatross protocol, and what does each one do?",
    description: 'Detail the distinction: rapid micro blocks for throughput and transactional payload vs macro blocks for epoch finality and checkpointing.',
    difficulty: 'Medium-hard',
    rewardPoolLuna: 25_000_000,
  },
  {
    id: 'topic-medhard-2',
    title: 'What happens when a validator fails to produce a block on time (skip blocks)?',
    description: 'Explain the timeout mechanism, skip block creation, and how the network maintains liveness without stalling.',
    difficulty: 'Medium-hard',
    rewardPoolLuna: 25_000_000,
  },
  {
    id: 'topic-medhard-3',
    title: 'What gets slashed if a validator misbehaves, and why do stakers share that risk?',
    description: 'Cover double-signing, fork production, slashing penalties, and why stakers must choose trustworthy validators.',
    difficulty: 'Medium-hard',
    rewardPoolLuna: 25_000_000,
  },

  // 5. Hard (400 NIM Pool)
  {
    id: 'topic-hard-1',
    title: 'What are epochs and batches in Albatross, and why does the protocol organize time this way?',
    description: 'Break down how batches and epochs structure validator rotation, reward distribution, and finality checkpoints.',
    difficulty: 'Hard',
    rewardPoolLuna: 40_000_000,
  },
  {
    id: 'topic-hard-2',
    title: 'Explain the two-step voting process for a macro block (Tendermint-based BFT) — what is each step for?',
    description: 'Detail the pre-vote and pre-commit phases, quorum thresholds, and how safety is guaranteed against equivocation.',
    difficulty: 'Hard',
    rewardPoolLuna: 40_000_000,
  },
  {
    id: 'topic-hard-3',
    title: 'What is the 3f+1 Byzantine fault tolerance assumption, and what does it actually guarantee?',
    description: 'Explain mathematical BFT limits: why the protocol tolerates up to one-third malicious validators and guarantees safety and liveness.',
    difficulty: 'Hard',
    rewardPoolLuna: 40_000_000,
  },

  // 6. Expert (600 NIM Pool)
  {
    id: 'topic-expert-1',
    title: 'How does an election macro block select the next validator set, and why does that matter for decentralization?',
    description: 'Explore the VRF / randomness generation, stake-weighted selection algorithm, and Sybil resistance in validator elections.',
    difficulty: 'Expert',
    rewardPoolLuna: 60_000_000,
  },
  {
    id: 'topic-expert-2',
    title: 'Explain how zero-knowledge proofs (Arkworks/Groth16) are used inside Albatross, and what problem they solve.',
    description: 'Analyze SNARKs for recursive epoch compression, enabling ultra-light mobile clients to verify consensus in milliseconds.',
    difficulty: 'Expert',
    rewardPoolLuna: 60_000_000,
  },
  {
    id: 'topic-expert-3',
    title: "What's the actual trade-off Albatross makes to hit 1000+ TPS with sub-second finality that other PoS chains don't make?",
    description: 'Critique the architectural compromises: optimistic pipeline, validator set sizing, communication overhead, and state storage.',
    difficulty: 'Expert',
    rewardPoolLuna: 60_000_000,
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

  // Seed / Upsert the 18 Curated Questions
  const upsertTopic = db.prepare(`
    INSERT INTO topics (id, title, description, difficulty, round_status, round_end_timestamp, reward_pool_luna)
    VALUES (?, ?, ?, ?, 'open', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      difficulty = excluded.difficulty,
      reward_pool_luna = excluded.reward_pool_luna
  `)

  for (const t of CURATED_TOPICS) {
    upsertTopic.run(
      t.id,
      t.title,
      t.description,
      t.difficulty,
      Date.now() + 1000 * 60 * 60 * 72, // 72 hours
      t.rewardPoolLuna
    )
  }

  // Seed initial sample explainers if none exist
  const existingExplainers = db.prepare('SELECT COUNT(*) as count FROM explainers').get() as { count: number }
  if (existingExplainers.count === 0) {
    const insertExplainer = db.prepare(`
      INSERT INTO explainers (
        id, topic_id, teacher_name, content_type, video_url, content_url, content_text,
        payout_address, total_backed_luna, backer_count, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // Simple video explainer
    insertExplainer.run(
      'exp-1',
      'topic-simple-1',
      'Alex Rivera',
      'video',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      null,
      'NQ48 8CKH BA24 2VR3 N249 N8MN J5XX 74DB 5XJ8',
      800_000,
      3,
      Date.now() - 1000 * 60 * 60 * 5
    )

    // Medium blog writeup explainer
    insertExplainer.run(
      'exp-2',
      'topic-medium-3',
      'Sofia Chen',
      'article',
      null,
      'https://medium.com/@sofiachen/sub-second-finality-in-nimiq-albatross',
      'A deep dive into how Nimiq Albatross achieves sub-second finality using micro-blocks and view changes, replacing PoW with energy-efficient validator slots.',
      'NQ48 8CKH BA24 2VR3 N249 N8MN J5XX 74DB 5XJ8',
      1_200_000,
      4,
      Date.now() - 1000 * 60 * 60 * 8
    )

    // Hard in-app written explainer
    insertExplainer.run(
      'exp-3',
      'topic-hard-2',
      'Marcus Vance',
      'text',
      null,
      null,
      `### The Two-Step Voting Process in Albatross

In Nimiq's Albatross consensus (derived from Tendermint-style BFT), each macro block requires a two-step voting round:

1. **Pre-Vote**: Validators inspect the proposed macro block and cast a pre-vote if the block header, state transitions, and validator selection are valid. This ensures a 2/3+ supermajority of the active validator set saw and agreed upon the proposed block candidate.

2. **Pre-Commit**: Once a validator sees 2/3+ pre-votes for the block, it casts a pre-commit vote. Once 2/3+ pre-commits are accumulated, the macro block is definitively locked and finalized.

This two-phase commit is what mathematically guarantees Byzantine Fault Tolerance up to 3f + 1: even in asynchronous networks, a malicious fork is physically impossible without more than 1/3 of validators double-signing and forfeiting their stake.`,
      'NQ48 8CKH BA24 2VR3 N249 N8MN J5XX 74DB 5XJ8',
      1_500_000,
      6,
      Date.now() - 1000 * 60 * 60 * 12
    )
  }
}
