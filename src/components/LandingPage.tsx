import React from 'react'
import {
  Sparkles,
  ArrowRight,
  Video,
  FileText,
  PenTool,
  GraduationCap,
  Scale,
  Zap,
  Lock
} from 'lucide-react'

interface LandingPageProps {
  onEnterApp: () => void
  topicsCount?: number
  totalPoolNim?: number
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  topicsCount = 18,
  totalPoolNim = 1550,
}) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 pt-safe pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Teach It Back
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              Nimiq Pay
            </span>
          </span>
        </div>

        <button
          onClick={onEnterApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <span>Open App</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="px-5 pt-8 pb-10 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Methodology Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-amber-500/30 text-amber-300 text-xs font-medium mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>The Feynman Technique on Nimiq</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3.5 leading-tight">
          Master Web3 by <br />
          <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            Teaching It Back
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-sm text-slate-300 leading-relaxed max-w-sm mb-7">
          Passive reading creates the illusion of competence. True mastery comes from explaining
          complex ideas in plain words. Teach concepts in 2 minutes, get peer-reviewed, and earn
          direct micro-backing from learners who found your explanation useful.
        </p>

        {/* Primary Action Button */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onEnterApp}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <span>Enter App & Explore Topics</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#how-it-works"
            className="py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
          >
            <span>See how it works</span>
            <span>↓</span>
          </a>
        </div>

        {/* Protocol Stats Strip */}
        <div className="grid grid-cols-3 gap-2 w-full mt-8 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold font-mono text-amber-400">{topicsCount}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Topics</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-lg font-bold font-mono text-emerald-400">6</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Tiers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold font-mono text-yellow-300">{totalPoolNim.toLocaleString()} NIM</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Community Pool</span>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className="px-5 py-7 bg-slate-900/40 border-y border-slate-800/60">
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <GraduationCap className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">The Feynman Principle</span>
          </div>
          <blockquote className="text-sm italic text-slate-200 mb-2.5">
            &ldquo;If you cannot explain something in simple terms, you do not understand it well enough.&rdquo;
          </blockquote>
          <p className="text-xs text-slate-400 leading-relaxed">
            Most people read crypto docs, nod their heads, and forget everything an hour later.
            <strong className="text-slate-300 font-semibold"> Teach It Back </strong> forces you to break through the jargon barrier. When you explain Albatross consensus or ZK-SNARKs simply, the entire Nimiq community benefits.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-5 py-9 flex flex-col gap-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
            The Accountability Engine
          </span>
          <h2 className="text-xl font-bold text-white mt-1">How It Works in 4 Steps</h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Pick a Curated Question</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Choose from 18 foundational questions spanning <span className="text-emerald-400 font-medium">Simple</span> (&ldquo;What is NIM?&rdquo;) to <span className="text-purple-400 font-medium">Expert</span> (&ldquo;Albatross Groth16 Proofs&rdquo;).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Submit Your Explainer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Choose your preferred medium:
              </p>
              <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                <div className="p-2 rounded bg-slate-800/70 text-center flex flex-col items-center">
                  <Video className="w-3.5 h-3.5 text-sky-400 mb-1" />
                  <span className="text-[10px] text-slate-300 font-medium">Video/Audio</span>
                </div>
                <div className="p-2 rounded bg-slate-800/70 text-center flex flex-col items-center">
                  <FileText className="w-3.5 h-3.5 text-teal-400 mb-1" />
                  <span className="text-[10px] text-slate-300 font-medium">Blog Link</span>
                </div>
                <div className="p-2 rounded bg-slate-800/70 text-center flex flex-col items-center">
                  <PenTool className="w-3.5 h-3.5 text-amber-400 mb-1" />
                  <span className="text-[10px] text-slate-300 font-medium">Direct Text</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Community Backs Clarity</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Learners and peers review explainers. When an answer makes a hard concept click, they back it with <strong className="text-slate-200">1, 5, or 10 NIM</strong> via 1-tap Nimiq Pay approval.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Community Pool Highlights What's Useful</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                No arbitrary prize pools. The community pool represents the real NIM backed by peers. Explanations with the most community support rise to the top as the most helpful.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Critical Economic Premise: Fair Play Rule */}
      <section className="px-5 py-7 bg-amber-950/20 border-y border-amber-500/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-300">100% Direct Community Backing</h3>
            <p className="text-xs text-amber-100/80 mt-1.5 leading-relaxed">
              <strong className="text-amber-200">Backers receive no financial return.</strong> A backing transaction is a one-way micro-tip plus a vote for clarity.
            </p>
            <p className="text-[11px] text-amber-200/60 mt-1.5 leading-relaxed">
              100% of community-backed funds go straight to rewarding the teachers whose explanations made complex concepts click for learners.
            </p>
          </div>
        </div>
      </section>

      {/* Difficulty Tiers & Topics */}
      <section className="px-5 py-9 flex flex-col gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
            Learning Pathways
          </span>
          <h2 className="text-xl font-bold text-white mt-1">18 Curated Topics</h2>
          <p className="text-xs text-slate-400 mt-1">Structured across 6 technical progression tiers:</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Simple</span>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">3 Challenges</span>
            </div>
            <p className="text-[11px] text-slate-400">NIM basics & wallets</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-teal-400">Easy</span>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">3 Challenges</span>
            </div>
            <p className="text-[11px] text-slate-400">Browser nodes & staking</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-sky-400">Medium</span>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">3 Challenges</span>
            </div>
            <p className="text-[11px] text-slate-400">PoS & finality</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-amber-400">Med-Hard</span>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">3 Challenges</span>
            </div>
            <p className="text-[11px] text-slate-400">Blocks & slashing</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-orange-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-orange-400">Hard</span>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">3 Challenges</span>
            </div>
            <p className="text-[11px] text-slate-400">Epochs & BFT voting</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-purple-400">Expert</span>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">3 Challenges</span>
            </div>
            <p className="text-[11px] text-slate-400">ZK-SNARKs & TPS trade-offs</p>
          </div>
        </div>
      </section>

      {/* Powered By Nimiq Pay */}
      <section className="px-5 py-7 bg-slate-900/60 border-t border-slate-800">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold mb-3">
          Native Nimiq Pay Advantages
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Sub-Second Finality</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Instant micro-tips confirmed on Albatross.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">100% Non-Custodial</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Signed natively via Nimiq Pay dialogs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="px-5 py-10 bg-gradient-to-b from-slate-900/50 to-slate-950 pb-safe text-center flex flex-col items-center">
        <h3 className="text-xl font-bold text-white mb-2">Ready to Prove What You Know?</h3>
        <p className="text-xs text-slate-400 max-w-xs mb-6">
          Explore current topics, review explainers from the community, or post your own breakdown to earn NIM.
        </p>

        <button
          onClick={onEnterApp}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
        >
          <span>Launch Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-slate-500 mt-6 font-mono">
          Built for Nimiq Mini Apps Competition &middot; Cycle III
        </p>
      </section>
    </div>
  )
}
