import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  Search,
  FileText,
  BarChart3,
  Target,
  AlertTriangle,
  HelpCircle,
  DollarSign,
  Award,
  ArrowRight,
  Zap,
  Shield,
  Layers,
  TrendingUp,
} from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="-mx-4 sm:-mx-6">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full">
            <Zap size={12} />
            AI-powered proposal generation
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--foreground)] leading-tight">
            Win more freelance jobs with proposals that{' '}
            <span className="text-[var(--primary)]">sound like you</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)] max-w-xl mx-auto">
            Paste a job description, get an instant analysis and a personalized proposal — then score it, refine it, and track your results.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <>
                <Link
                  href="/proposals/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white text-sm font-semibold rounded-[var(--radius)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                >
                  New proposal <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-sm font-semibold rounded-[var(--radius)] hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white text-sm font-semibold rounded-[var(--radius)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                >
                  Get started <ArrowRight size={16} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-sm font-semibold rounded-[var(--radius)] hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-2xl font-bold text-center text-[var(--foreground)] mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { step: '1', icon: Layers, title: 'Set up your profile', desc: 'Add your skills, projects and portfolio links once.' },
            { step: '2', icon: FileText, title: 'Paste the job description', desc: 'Drop in the listing from any freelance platform.' },
            { step: '3', icon: Zap, title: 'Get analysis & proposal', desc: 'Instant skill match, pricing estimate and a tailored proposal.' },
            { step: '4', icon: TrendingUp, title: 'Score it & track results', desc: 'Get honest feedback, refine, and watch your win rate.' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <span className="absolute -top-3 -left-2 flex items-center justify-center w-7 h-7 rounded-full bg-[var(--primary)] text-white text-xs font-bold shadow-sm">
                {step}
              </span>
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 inline-flex mb-3">
                <Icon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{title}</h3>
              <p className="text-sm text-[var(--muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 bg-gray-50/50" aria-labelledby="features">
        <h2 id="features" className="text-2xl font-bold text-center text-[var(--foreground)] mb-3">
          Everything you need to land the gig
        </h2>
        <p className="text-center text-[var(--muted)] mb-10 max-w-lg mx-auto">
          From analysis to tracking — every step covered.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Job Analysis */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <Search size={20} />
              </div>
              <h3 className="font-semibold text-[var(--foreground)]">Job Analysis</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li className="flex items-start gap-2"><Target size={14} className="mt-0.5 text-blue-500 shrink-0" /> Requirements and skill matching</li>
              <li className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 text-amber-500 shrink-0" /> Red flags and risks</li>
              <li className="flex items-start gap-2"><HelpCircle size={14} className="mt-0.5 text-purple-500 shrink-0" /> Clarifying questions</li>
              <li className="flex items-start gap-2"><DollarSign size={14} className="mt-0.5 text-emerald-500 shrink-0" /> Pricing and timeline estimate</li>
            </ul>
          </div>

          {/* Personalized Proposals */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <FileText size={20} />
              </div>
              <h3 className="font-semibold text-[var(--foreground)]">Personalized Proposals</h3>
            </div>
            <p className="text-sm text-[var(--muted)] mb-3">
              Tailored to each platform&apos;s style and expectations.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Upwork', 'Fiverr', 'Freelancer', 'PeoplePerHour'].map(p => (
                <span key={p} className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Score & Feedback */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                <Award size={20} />
              </div>
              <h3 className="font-semibold text-[var(--foreground)]">Proposal Score &amp; Feedback</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li className="flex items-start gap-2"><Shield size={14} className="mt-0.5 text-amber-500 shrink-0" /> Honest scoring — no inflated numbers</li>
              <li className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 text-red-400 shrink-0" /> Flags unsupported claims</li>
              <li className="flex items-start gap-2"><Zap size={14} className="mt-0.5 text-indigo-500 shrink-0" /> Better opening suggestion</li>
            </ul>
          </div>

          {/* Dashboard */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                <BarChart3 size={20} />
              </div>
              <h3 className="font-semibold text-[var(--foreground)]">Win-Rate Dashboard</h3>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Track submitted, replied and won proposals. See your reply rate, win rate and average score — broken down by platform and tone.
            </p>
          </div>
        </div>
      </section>

      {/* ── Example card ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16" aria-labelledby="example">
        <h2 id="example" className="text-2xl font-bold text-center text-[var(--foreground)] mb-3">
          See it in action
        </h2>
        <p className="text-center text-[var(--muted)] mb-8 max-w-md mx-auto">
          Here&apos;s what a quick analysis and score look like.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Sample Analysis */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Example
              </span>
              <span className="text-xs text-[var(--muted)]">Analysis snippet</span>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">Client needs</p>
            <ul className="text-sm text-[var(--muted)] space-y-1 mb-4">
              <li className="flex items-start gap-1.5">- Responsive React dashboard with charts</li>
              <li className="flex items-start gap-1.5">- REST API integration (Node.js)</li>
              <li className="flex items-start gap-1.5">- Deploy to Vercel within 2 weeks</li>
            </ul>
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">Skill match</p>
            <div className="flex flex-wrap gap-1.5">
              {['React', 'Node.js', 'Tailwind CSS'].map(s => (
                <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{s}</span>
              ))}
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200">D3.js (gap)</span>
            </div>
          </div>

          {/* Sample Score */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Example
              </span>
              <span className="text-xs text-[var(--muted)]">Score breakdown</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200">
                <span className="text-lg font-bold text-emerald-700">74</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Overall Score</p>
                <p className="text-xs text-[var(--muted)]">out of 100</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Hook', score: 8 },
                { label: 'Relevance', score: 7 },
                { label: 'Specificity', score: 6 },
                { label: 'Clarity', score: 9 },
                { label: 'Call to action', score: 7 },
              ].map(({ label, score }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)] w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)] w-5 text-right">{score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 text-center bg-gradient-to-b from-indigo-50/50 to-transparent">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
          Ready to write proposals that win?
        </h2>
        <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
          Set up your profile in under a minute. Your first proposal is free.
        </p>
        {user ? (
          <Link
            href="/proposals/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white text-sm font-semibold rounded-[var(--radius)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            Create a proposal <ArrowRight size={16} />
          </Link>
        ) : (
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white text-sm font-semibold rounded-[var(--radius)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            Get started free <ArrowRight size={16} />
          </Link>
        )}
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 px-4 sm:px-6 py-8 text-center">
        <p className="text-sm font-semibold text-[var(--foreground)]">ProposalAI</p>
        <p className="text-xs text-[var(--muted)] mt-1">
          Built with Next.js, Supabase and Groq
        </p>
      </footer>
    </div>
  )
}