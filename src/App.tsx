import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNimiq } from './hooks/useNimiq'
import { Topic, Explainer, ExplainerContentType, TopicDifficulty, BACKING_TIERS } from './types'
import { formatAddress, shortenAddress, checkKnownAddressLabel, lunaToNim } from './utils/address'
import { ValidationUtils } from '@nimiq/utils/validation-utils'
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  PlusCircle,
  Trophy,
  BookOpen,
  ShieldAlert,
  Layers,
  Sparkles,
  Smartphone,
  Play,
  Clock,
  RefreshCw,
  X,
  FileText,
  Video,
  PenTool
} from 'lucide-react'

// Derive API Base URL:
// - If VITE_API_URL is set, use it.
// - In production (PROD), default to '' so all requests use relative paths against the serving domain.
// - In dev, resolve to Mac LAN IP so mobile device over Wi-Fi can reach the API.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? ''
    : typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? `http://${window.location.hostname}:3001`
      : 'http://localhost:3001')

export const DIFFICULTY_LEVELS = [
  'All',
  'Simple',
  'Easy',
  'Medium',
  'Medium-hard',
  'Hard',
  'Expert',
] as const

export function getDifficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case 'Simple':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    case 'Easy':
      return 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    case 'Medium':
      return 'bg-sky-500/20 text-sky-300 border-sky-500/40'
    case 'Medium-hard':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    case 'Hard':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/40'
    case 'Expert':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700'
  }
}

export default function App() {
  const {
    isConnecting,
    isReady,
    isInsideNimiqPay,
    error: providerError,
    currentAccount,
    blockNumber,
    consensus,
    connectWallet,
    disconnectWallet,
    fetchDeviceId,
    sendBackingTransaction,
  } = useNimiq()

  const [activeTab, setActiveTab] = useState<'topics' | 'leaderboard' | 'treasury'>('topics')
  const [selectedTopicId, setSelectedTopicId] = useState<string>('topic-simple-1')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All')
  const [topics, setTopics] = useState<Topic[]>([])
  const [explainers, setExplainers] = useState<Explainer[]>([])
  const [treasuryInfo, setTreasuryInfo] = useState<{
    treasuryAddress: string
    totalTransactions: number
    totalIndexedLuna: number
    recentTransactions: any[]
  } | null>(null)

  // Loading & syncing
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Backing state
  const [isBacking, setIsBacking] = useState<string | null>(null)
  const [backingStatus, setBackingStatus] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
    txHash?: string
  } | null>(null)

  // Anti-Abuse Rate-limiting cooldown
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0)

  // Content Preview Modal (for Video or Written Text)
  const [activeContent, setActiveContent] = useState<{
    type: ExplainerContentType
    title: string
    teacherName: string
    url?: string
    text?: string
    explainer: Explainer
  } | null>(null)

  // Explainer submission modal
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitContentType, setSubmitContentType] = useState<ExplainerContentType>('video')
  const [newTeacherName, setNewTeacherName] = useState('')
  const [newContentUrl, setNewContentUrl] = useState('')
  const [newContentText, setNewContentText] = useState('')
  const [newPayoutAddress, setNewPayoutAddress] = useState('')
  const [addressError, setAddressError] = useState<string | null>(null)
  const [addressWarning, setAddressWarning] = useState<string | null>(null)
  const [confirmedAddressWarning, setConfirmedAddressWarning] = useState(false)

  // Fetch live state from Backend
  const refreshData = useCallback(async () => {
    try {
      const [topicsRes, explainersRes, treasuryRes] = await Promise.all([
        fetch(`${API_BASE}/api/topics`),
        fetch(`${API_BASE}/api/explainers`),
        fetch(`${API_BASE}/api/treasury`),
      ])

      if (topicsRes.ok) {
        const data = await topicsRes.json()
        setTopics(
          data.topics.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            difficulty: (t.difficulty || 'Easy') as TopicDifficulty,
            roundStatus: t.round_status,
            roundEndTimestamp: t.round_end_timestamp,
            rewardPoolLuna: t.reward_pool_luna,
          }))
        )
      }

      if (explainersRes.ok) {
        const data = await explainersRes.json()
        setExplainers(
          data.explainers.map((e: any) => ({
            id: e.id,
            topicId: e.topic_id,
            teacherName: e.teacher_name,
            contentType: (e.content_type || 'video') as ExplainerContentType,
            videoUrl: e.video_url || e.content_url || undefined,
            contentUrl: e.content_url || undefined,
            contentText: e.content_text || undefined,
            payoutAddress: e.payout_address,
            totalBackedLuna: e.total_backed_luna,
            backerCount: e.backer_count,
            createdAt: e.created_at,
          }))
        )
      }

      if (treasuryRes.ok) {
        const data = await treasuryRes.json()
        setTreasuryInfo(data)
      }
    } catch (err) {
      console.warn('Backend offline, using local state:', err)
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 10000)
    return () => clearInterval(interval)
  }, [refreshData])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = setInterval(() => {
      setCooldownRemaining(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownRemaining])

  const treasuryAddress =
    treasuryInfo?.treasuryAddress || 'NQ80 TEAC H1TB ACK7 REAS URYT ESTN ETVA LADA'

  // Filter topics by selected difficulty
  const filteredTopics = useMemo(() => {
    if (selectedDifficulty === 'All') return topics
    return topics.filter(t => t.difficulty === selectedDifficulty)
  }, [topics, selectedDifficulty])

  // Filter explainers by selected topic
  const currentTopic = useMemo(
    () => topics.find(t => t.id === selectedTopicId) || filteredTopics[0] || topics[0] || null,
    [topics, filteredTopics, selectedTopicId]
  )

  const currentExplainers = useMemo(
    () => explainers.filter(e => e.topicId === selectedTopicId),
    [explainers, selectedTopicId]
  )

  // Compute Leaderboard across all topics
  const leaderboard = useMemo(() => {
    return [...explainers]
      .sort((a, b) => b.totalBackedLuna - a.totalBackedLuna)
      .map((e, index) => ({
        id: e.id,
        teacherName: e.teacherName,
        payoutAddress: e.payoutAddress,
        totalBackedLuna: e.totalBackedLuna,
        backerCount: e.backerCount,
        rank: index + 1,
      }))
  }, [explainers])

  // Backing Handler
  const handleBackExplainer = async (explainer: Explainer, tierLuna: number, tierLabel: string) => {
    setBackingStatus(null)

    // Rate Limit Cooldown Check
    if (cooldownRemaining > 0) {
      setBackingStatus({
        type: 'warning',
        message: `Please wait ${cooldownRemaining}s before sending another backing from this device.`,
      })
      return
    }

    // Anti-Abuse 1: Block self-backing
    if (currentAccount && formatAddress(currentAccount) === formatAddress(explainer.payoutAddress)) {
      setBackingStatus({
        type: 'error',
        message:
          'Anti-Abuse Rule: You cannot back your own submission. Self-backed amounts are excluded from pool tally.',
      })
      return
    }

    setIsBacking(explainer.id)

    // Anti-Abuse 2: Device Identifier
    await fetchDeviceId('Rate-limiting repeated backing contributions')

    try {
      const res = await sendBackingTransaction({
        recipient: treasuryAddress,
        valueLuna: tierLuna,
        topicId: explainer.topicId,
        explainerId: explainer.id,
      })

      if (res.success) {
        setBackingStatus({
          type: 'success',
          message: `Successfully backed ${explainer.teacherName} with ${tierLabel}! Tag: back:${explainer.topicId}:${explainer.id}`,
          txHash: res.txHash,
        })

        // 15-second device rate limit cooldown
        setCooldownRemaining(15)

        // Optimistically update
        setExplainers(prev =>
          prev.map(e =>
            e.id === explainer.id
              ? {
                  ...e,
                  totalBackedLuna: e.totalBackedLuna + tierLuna,
                  backerCount: e.backerCount + 1,
                }
              : e
          )
        )

        setTimeout(refreshData, 3000)
      } else {
        setBackingStatus({
          type: 'error',
          message: res.error || 'Transaction was canceled or failed.',
        })
      }
    } catch (err: unknown) {
      setBackingStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown transaction error.',
      })
    } finally {
      setIsBacking(null)
    }
  }

  // Address Input with Checksum & Label Verification
  const handleAddressChange = (addr: string) => {
    setNewPayoutAddress(addr)
    const clean = addr.trim()

    if (!clean) {
      setAddressError(null)
      setAddressWarning(null)
      return
    }

    if (!ValidationUtils.isValidAddress(clean)) {
      setAddressError('Invalid Nimiq address format or checksum. Format: NQxx xxxx xxxx...')
      setAddressWarning(null)
      return
    }

    setAddressError(null)

    const label = checkKnownAddressLabel(clean)
    if (label) {
      setAddressWarning(
        `This address is labeled as "${label}". Shared deposit or pool addresses can result in lost reward payouts. Only proceed if you control this wallet.`
      )
      setConfirmedAddressWarning(false)
    } else {
      setAddressWarning(null)
      setConfirmedAddressWarning(true)
    }
  }

  // Submit new explainer (Video, Blog Post, or Direct Text)
  const handleSubmitExplainer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTeacherName.trim() || !newPayoutAddress.trim()) {
      alert('Please fill in your name and payout address.')
      return
    }

    if (submitContentType === 'text' && newContentText.trim().length < 20) {
      alert('Please write at least 20 characters for your direct text explainer.')
      return
    }

    if (submitContentType !== 'text' && !newContentUrl.trim()) {
      alert('Please provide a valid link for your video or blog post.')
      return
    }

    if (addressError) {
      alert('Please correct the payout address error.')
      return
    }

    if (addressWarning && !confirmedAddressWarning) {
      alert('Please acknowledge the exchange/pool address warning before proceeding.')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/explainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId,
          teacherName: newTeacherName.trim(),
          contentType: submitContentType,
          contentUrl: submitContentType !== 'text' ? newContentUrl.trim() : null,
          contentText: submitContentType === 'text' ? newContentText.trim() : null,
          payoutAddress: formatAddress(newPayoutAddress.trim()),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to submit explainer.')
        return
      }

      await refreshData()
      setShowSubmitModal(false)
      setNewTeacherName('')
      setNewContentUrl('')
      setNewContentText('')
      setNewPayoutAddress('')
      setAddressWarning(null)
    } catch {
      alert('Backend connection error. Please ensure the server is running.')
    }
  }

  // Format video embed URL
  const getEmbedUrl = (url?: string): string | null => {
    if (!url) return null
    try {
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        let id = ''
        if (url.includes('youtu.be/')) {
          id = url.split('youtu.be/')[1].split('?')[0]
        } else {
          id = new URL(url).searchParams.get('v') || ''
        }
        return `https://www.youtube-nocookie.com/embed/${id}`
      }
      if (url.includes('loom.com/share/')) {
        const id = url.split('loom.com/share/')[1].split('?')[0]
        return `https://www.loom.com/embed/${id}`
      }
      if (url.includes('vimeo.com/')) {
        const id = url.split('vimeo.com/')[1].split('?')[0]
        return `https://player.vimeo.com/video/${id}`
      }
    } catch {
      // Fallback
    }
    return null
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-950 text-slate-100 pb-24 selection:bg-amber-400 selection:text-slate-950">
      {/* Top App Header with Safe-Area support */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Teach It Back
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  NIM Mini App
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Micro-Backing & Topic Accountability</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              title="Sync latest tallies"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  isInsideNimiqPay
                    ? 'bg-emerald-400 animate-pulse'
                    : isReady
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-[11px] text-slate-300">
                {isInsideNimiqPay ? 'Nimiq Pay' : 'Browser Mode'}
              </span>
            </div>
          </div>
        </div>

        {(blockNumber !== null || consensus !== null) && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Albatross Block #{blockNumber?.toLocaleString() ?? 'Syncing'}
            </span>
            <span>Consensus: {consensus ? 'OK' : 'Syncing'}</span>
          </div>
        )}
      </header>

      {/* Wallet Connection Banner */}
      <section className="px-4 py-3 bg-slate-900/40 border-b border-slate-800/60">
        {currentAccount ? (
          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium">Connected Wallet</p>
                <p className="font-mono text-xs text-amber-300 font-semibold truncate">
                  {shortenAddress(currentAccount)}
                </p>
              </div>
            </div>

            <button
              onClick={disconnectWallet}
              className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-rose-900/50 transition-colors shrink-0 min-h-[44px] flex items-center"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-800 to-slate-900 border border-amber-500/30 rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div>
                <p className="font-semibold text-xs text-amber-200">Connect to Back Explainers</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sign with your native Nimiq Pay wallet. Backing is a pure merit tip (no financial returns).
                </p>
              </div>
              <Wallet className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            </div>

            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-[0.99] text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Waiting for approval...' : 'Connect Nimiq Wallet'}
            </button>
          </div>
        )}

        {providerError && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{providerError}</span>
          </div>
        )}
      </section>

      {/* Backing Status Toast */}
      {backingStatus && (
        <section className="px-4 pt-3">
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              backingStatus.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : backingStatus.type === 'warning'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            {backingStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : backingStatus.type === 'warning' ? (
              <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{backingStatus.message}</p>
              {backingStatus.txHash && (
                <p className="font-mono text-[10px] text-slate-400 mt-1 break-all">
                  Tx: {backingStatus.txHash}
                </p>
              )}
            </div>
            <button
              onClick={() => setBackingStatus(null)}
              className="text-slate-400 hover:text-white p-1 text-xs"
            >
              ✕
            </button>
          </div>
        </section>
      )}

      {/* Main Tab Navigation */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-3 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('topics')}
            className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'topics'
                ? 'bg-amber-400 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Topics
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-amber-400 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('treasury')}
            className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'treasury'
                ? 'bg-amber-400 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Treasury
          </button>
        </div>
      </div>

      {/* Tab 1: Topics & Multi-Format Explainers */}
      {activeTab === 'topics' && (
        <main className="px-4 py-2 space-y-4">
          {/* Topic Selector Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Active Round Topics ({filteredTopics.length})
              </h2>
              {currentTopic && (
                <span className="text-[11px] text-amber-400 font-medium font-mono">
                  Pool: {lunaToNim(currentTopic.rewardPoolLuna)} NIM
                </span>
              )}
            </div>

            {/* Difficulty Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DIFFICULTY_LEVELS.map(diff => {
                const isSelected = selectedDifficulty === diff
                const count = diff === 'All' ? topics.length : topics.filter(t => t.difficulty === diff).length
                return (
                  <button
                    key={diff}
                    onClick={() => {
                      setSelectedDifficulty(diff)
                      const matching = diff === 'All' ? topics : topics.filter(t => t.difficulty === diff)
                      if (matching.length > 0 && !matching.some(t => t.id === selectedTopicId)) {
                        setSelectedTopicId(matching[0].id)
                      }
                    }}
                    className={`shrink-0 min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{diff}</span>
                    <span
                      className={`text-[9px] font-mono px-1 rounded ${
                        isSelected ? 'bg-amber-500/40 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Scrollable Topic Cards */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {filteredTopics.map(t => {
                const isSelected = t.id === selectedTopicId
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopicId(t.id)}
                    className={`shrink-0 w-72 text-left p-3 rounded-xl border transition-all min-h-[44px] flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/95 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[9px] uppercase font-bold font-mono px-1.5 py-0.5 rounded border ${getDifficultyBadgeClass(
                            t.difficulty
                          )}`}
                        >
                          {t.difficulty}
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          {lunaToNim(t.rewardPoolLuna)} NIM
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-white line-clamp-2 leading-snug">{t.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5">
                      {t.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Current Topic Detail & Submit Action */}
          {currentTopic && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded border ${getDifficultyBadgeClass(
                      currentTopic.difficulty
                    )}`}
                  >
                    {currentTopic.difficulty} Tier
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wide font-mono">
                    Round {currentTopic.roundStatus}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">{currentTopic.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{currentTopic.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Explainers: <span className="text-slate-200 font-semibold">{currentExplainers.length}</span>
                </div>
                <button
                  onClick={() => {
                    if (currentAccount) {
                      setNewPayoutAddress(currentAccount)
                    }
                    setShowSubmitModal(true)
                  }}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Submit Explainer
                </button>
              </div>
            </div>
          )}

          {/* Explainers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Community Explainers ({currentExplainers.length})
              </h2>
              {cooldownRemaining > 0 && (
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Cooldown: {cooldownRemaining}s
                </span>
              )}
            </div>

            {currentExplainers.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400">No explainers submitted for this topic yet.</p>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="mt-3 text-xs text-amber-400 font-semibold underline"
                >
                  Share a video, blog post, or written explainer!
                </button>
              </div>
            ) : (
              currentExplainers.map(explainer => {
                const isOwnExplainer = Boolean(
                  currentAccount &&
                  formatAddress(currentAccount) === formatAddress(explainer.payoutAddress)
                )

                return (
                  <div
                    key={explainer.id}
                    className="bg-slate-900 border border-slate-800/90 rounded-xl p-3.5 space-y-3 transition-all hover:border-slate-700"
                  >
                    {/* Explainer Header with Format Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white">{explainer.teacherName}</h4>

                          {/* Content Format Pill */}
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            {explainer.contentType === 'video' && <Video className="w-3 h-3 text-amber-400" />}
                            {explainer.contentType === 'article' && <FileText className="w-3 h-3 text-sky-400" />}
                            {explainer.contentType === 'text' && <PenTool className="w-3 h-3 text-emerald-400" />}
                            <span>
                              {explainer.contentType === 'video'
                                ? 'Video/Audio'
                                : explainer.contentType === 'article'
                                ? 'Blog Post'
                                : 'Written Note'}
                            </span>
                          </span>

                          {isOwnExplainer && (
                            <span className="text-[10px] bg-slate-800 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                              Your Submission
                            </span>
                          )}
                        </div>

                        <p className="font-mono text-[10px] text-slate-400 mt-1">
                          Payout: {shortenAddress(explainer.payoutAddress)}
                        </p>
                      </div>

                      {/* Action Button: Watch / Read Article / Read Text */}
                      <button
                        onClick={() =>
                          setActiveContent({
                            type: explainer.contentType,
                            title: `${explainer.teacherName}'s Explainer`,
                            teacherName: explainer.teacherName,
                            url: explainer.contentUrl || explainer.videoUrl,
                            text: explainer.contentText,
                            explainer,
                          })
                        }
                        className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 border transition-colors ${
                          explainer.contentType === 'video'
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : explainer.contentType === 'article'
                            ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {explainer.contentType === 'video' && <Play className="w-3.5 h-3.5 fill-current" />}
                        {explainer.contentType === 'article' && <ExternalLink className="w-3.5 h-3.5" />}
                        {explainer.contentType === 'text' && <BookOpen className="w-3.5 h-3.5" />}
                        <span>
                          {explainer.contentType === 'video'
                            ? 'Watch'
                            : explainer.contentType === 'article'
                            ? 'Read Blog'
                            : 'Read Text'}
                        </span>
                      </button>
                    </div>

                    {/* Direct Text Preview Snippet */}
                    {explainer.contentType === 'text' && explainer.contentText && (
                      <div
                        onClick={() =>
                          setActiveContent({
                            type: explainer.contentType,
                            title: `${explainer.teacherName}'s Explainer`,
                            teacherName: explainer.teacherName,
                            text: explainer.contentText,
                            explainer,
                          })
                        }
                        className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 line-clamp-3 font-mono cursor-pointer hover:border-slate-700 transition-colors"
                      >
                        {explainer.contentText}
                      </div>
                    )}

                    {/* Blog Post Preview Snippet */}
                    {explainer.contentType === 'article' && explainer.contentUrl && (
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                        <span className="truncate pr-2 font-mono text-sky-400">
                          {explainer.contentUrl.replace(/^https?:\/\//, '')}
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-slate-500" />
                      </div>
                    )}

                    {/* Backing Summary Bar */}
                    <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Backed</p>
                        <p className="font-mono font-bold text-amber-400 text-sm">
                          {lunaToNim(explainer.totalBackedLuna)} NIM
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Backers</p>
                        <p className="font-mono text-slate-200 text-sm font-medium">
                          {explainer.backerCount}
                        </p>
                      </div>
                    </div>

                    {/* Fixed Tier Backing Buttons (1 / 5 / 10 NIM) */}
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center justify-between">
                        <span>Send 1-way tip:</span>
                        {isOwnExplainer ? (
                          <span className="text-[10px] text-rose-400 font-mono font-semibold">
                            Self-backing blocked
                          </span>
                        ) : cooldownRemaining > 0 ? (
                          <span className="text-[10px] text-amber-400 font-mono">
                            Wait {cooldownRemaining}s
                          </span>
                        ) : null}
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        {BACKING_TIERS.map(tier => (
                          <button
                            key={tier.nim}
                            onClick={() => handleBackExplainer(explainer, tier.luna, tier.label)}
                            disabled={
                              isBacking === explainer.id ||
                              isOwnExplainer ||
                              cooldownRemaining > 0
                            }
                            className={`min-h-[44px] py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                              isOwnExplainer || cooldownRemaining > 0
                                ? 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-amber-400 hover:text-slate-950 active:scale-95 border border-slate-700 text-slate-200'
                            }`}
                          >
                            <span>{tier.label}</span>
                            <span className="text-[9px] opacity-75 font-mono">
                              ({tier.nim} NIM)
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </main>
      )}

      {/* Tab 2: Public Leaderboard */}
      {activeTab === 'leaderboard' && (
        <main className="px-4 py-2 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Public Explainer Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Public tally of verified backing across all rounds and formats (videos, blog write-ups,
              and direct text).
            </p>
          </div>

          <div className="space-y-2">
            {leaderboard.map(entry => (
              <div
                key={entry.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      entry.rank === 1
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : entry.rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{entry.teacherName}</h4>
                    <p className="font-mono text-[10px] text-slate-400">
                      {shortenAddress(entry.payoutAddress)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-xs text-amber-400">
                    {lunaToNim(entry.totalBackedLuna)} NIM
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{entry.backerCount} backers</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Tab 3: Treasury & Indexer Status */}
      {activeTab === 'treasury' && (
        <main className="px-4 py-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Treasury & Indexer Status
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Polling Live
              </span>
            </div>

            <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 space-y-2 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Treasury Address</p>
                <p className="font-mono text-xs text-amber-300 select-all break-all mt-0.5">
                  {treasuryAddress}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Indexed Backings</p>
                  <p className="font-mono font-bold text-sm text-white">
                    {treasuryInfo?.totalTransactions ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Total Indexed</p>
                  <p className="font-mono font-bold text-sm text-amber-400">
                    {lunaToNim(treasuryInfo?.totalIndexedLuna ?? 0)} NIM
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent On-Chain Backing Tally
            </h3>
            {treasuryInfo?.recentTransactions && treasuryInfo.recentTransactions.length > 0 ? (
              treasuryInfo.recentTransactions.map((tx: any) => (
                <div
                  key={tx.tx_hash}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">
                      From: {shortenAddress(tx.sender_address)}
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      +{lunaToNim(tx.value_luna)} NIM
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Tag: {tx.data_tag}</span>
                    {tx.is_self_backed ? (
                      <span className="text-rose-400 font-semibold">Self-backed (Excluded)</span>
                    ) : (
                      <span className="text-emerald-400">Verified</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                No transactions indexed yet. Send a 1 NIM backing to verify!
              </p>
            )}
          </div>
        </main>
      )}

      {/* Unified In-App Reader / Video Modal */}
      {activeContent && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800">
              <h3 className="font-bold text-xs text-white truncate">
                {activeContent.teacherName} —{' '}
                {activeContent.type === 'video'
                  ? 'Video Explainer'
                  : activeContent.type === 'article'
                  ? 'Article Writeup'
                  : 'Written Notes'}
              </h3>
              <button
                onClick={() => setActiveContent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Format */}
            {activeContent.type === 'video' && (
              <div className="aspect-video w-full bg-black flex items-center justify-center">
                {getEmbedUrl(activeContent.url) ? (
                  <iframe
                    src={getEmbedUrl(activeContent.url)!}
                    title="Explainer Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-xs text-slate-300">
                      External video host requires opening in player.
                    </p>
                    <a
                      href={activeContent.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs min-h-[44px]"
                    >
                      <ExternalLink className="w-4 h-4" /> Open Video Link
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Blog Post / Article Link Format */}
            {activeContent.type === 'article' && (
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-400">External Article Source:</p>
                  <p className="font-mono text-xs text-sky-400 break-all">{activeContent.url}</p>
                </div>
                {activeContent.text && (
                  <p className="text-xs text-slate-300 leading-relaxed">{activeContent.text}</p>
                )}
                <a
                  href={activeContent.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full min-h-[44px] py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Read Full Article on External Site
                </a>
              </div>
            )}

            {/* Direct Text Explainer Format */}
            {activeContent.type === 'text' && (
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="prose prose-invert max-w-none text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  {activeContent.text}
                </div>
              </div>
            )}

            {/* In-Modal Quick Backing Action Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Like this explainer?</span>
              <div className="flex gap-1.5">
                {BACKING_TIERS.map(tier => (
                  <button
                    key={tier.nim}
                    onClick={() => {
                      handleBackExplainer(activeContent.explainer, tier.luna, tier.label)
                      setActiveContent(null)
                    }}
                    className="min-h-[44px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Tip {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Format Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Submit Explainer
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Question Header */}
            {currentTopic && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Answering Question:</span>
                  <span
                    className={`text-[9px] uppercase font-bold font-mono px-1.5 py-0.5 rounded border ${getDifficultyBadgeClass(
                      currentTopic.difficulty
                    )}`}
                  >
                    {currentTopic.difficulty} Tier
                  </span>
                </div>
                <p className="text-xs font-bold text-white leading-snug">{currentTopic.title}</p>
              </div>
            )}

            {/* Format Selector Tabs */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Choose Format
              </label>
              <div className="grid grid-cols-3 p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setSubmitContentType('video')}
                  className={`min-h-[44px] py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                    submitContentType === 'video'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video/Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitContentType('article')}
                  className={`min-h-[44px] py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                    submitContentType === 'article'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Blog / Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitContentType('text')}
                  className={`min-h-[44px] py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                    submitContentType === 'text'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Direct Text</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitExplainer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Teacher Name / Alias
                </label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                  placeholder="e.g. Satoshi"
                  className="w-full min-h-[44px] px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Conditional Inputs based on format */}
              {submitContentType === 'video' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Video / Audio Link
                  </label>
                  <input
                    type="url"
                    required
                    value={newContentUrl}
                    onChange={e => setNewContentUrl(e.target.value)}
                    placeholder="https://youtu.be/... or Loom / Vimeo / SoundCloud"
                    className="w-full min-h-[44px] px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Paste an external link — we embed YouTube and Loom directly.
                  </p>
                </div>
              )}

              {submitContentType === 'article' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Blog Post / Writeup Link
                  </label>
                  <input
                    type="url"
                    required
                    value={newContentUrl}
                    onChange={e => setNewContentUrl(e.target.value)}
                    placeholder="https://substack.com/... or Medium, Notion, GitHub"
                    className="w-full min-h-[44px] px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Link to your Substack, Medium post, GitHub gist, or personal site.
                  </p>
                </div>
              )}

              {submitContentType === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Written Explainer / Summary</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {newContentText.length} chars (min 20)
                    </span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={newContentText}
                    onChange={e => setNewContentText(e.target.value)}
                    placeholder="Write your explanation directly here. Break down the concept in your own words, proving you understood it..."
                    className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-400 resize-none font-sans"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nimiq Payout Address
                </label>
                <input
                  type="text"
                  required
                  value={newPayoutAddress}
                  onChange={e => handleAddressChange(e.target.value)}
                  placeholder="NQxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx"
                  className={`w-full min-h-[44px] px-3 rounded-lg bg-slate-950 border text-xs font-mono text-slate-100 focus:outline-none ${
                    addressError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-amber-400'
                  }`}
                />

                {addressError && (
                  <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {addressError}
                  </p>
                )}

                {addressWarning && !addressError && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">{addressWarning}</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-500/20 text-[11px]">
                      <input
                        type="checkbox"
                        checked={confirmedAddressWarning}
                        onChange={e => setConfirmedAddressWarning(e.target.checked)}
                        className="rounded border-amber-500/50"
                      />
                      <span>I understand the risk and confirm this payout address.</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(addressError)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  Submit Explainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer & Local-Testing Verification Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-2.5 text-[10px] text-slate-400 max-w-md mx-auto">
        <div className="flex items-center justify-between font-mono">
          <span className="flex items-center gap-1 truncate">
            <Smartphone className="w-3 h-3 text-amber-400" />
            Treasury: {shortenAddress(treasuryAddress)}
          </span>
          <span className="text-slate-500 font-sans">Nimiq Cycle III</span>
        </div>
      </footer>
    </div>
  )
}
