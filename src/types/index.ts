export type ExplainerContentType = 'video' | 'article' | 'text'

export type TopicDifficulty =
  | 'Simple'
  | 'Easy'
  | 'Medium'
  | 'Medium-hard'
  | 'Hard'
  | 'Expert'

export interface Topic {
  id: string
  title: string
  description: string
  difficulty: TopicDifficulty
  roundStatus: 'open' | 'closed'
  roundEndTimestamp: number
  rewardPoolLuna: number // in Luna (1 NIM = 100,000 Luna)
}

export interface Explainer {
  id: string
  topicId: string
  teacherName: string
  contentType: ExplainerContentType
  videoUrl?: string // video link (YouTube, Loom, Vimeo)
  contentUrl?: string // blog post or write-up link (Substack, Medium, GitHub, Notion)
  contentText?: string // direct text explainer entered by user
  payoutAddress: string // Nimiq address
  totalBackedLuna: number // accumulated backing in Luna
  backerCount: number
  createdAt: number
}

export interface BackingTier {
  nim: number
  luna: number
  label: string
}

export const BACKING_TIERS: BackingTier[] = [
  { nim: 1, luna: 100_000, label: '1 NIM' },
  { nim: 5, luna: 500_000, label: '5 NIM' },
  { nim: 10, luna: 1_000_000, label: '10 NIM' },
]

export interface LeaderboardEntry {
  id: string
  teacherName: string
  payoutAddress: string
  totalBackedLuna: number
  backerCount: number
  rank: number
}

export interface BackingRecord {
  txHash: string
  topicId: string
  explainerId: string
  senderAddress: string
  valueLuna: number
  timestamp: number
  deviceTag?: string
  isSelfBacked: boolean
}
