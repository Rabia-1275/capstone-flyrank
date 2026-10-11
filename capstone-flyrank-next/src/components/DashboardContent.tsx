'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Send,
  MessageSquare,
  Trophy,
  Star,
  Info,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import type { DashboardData, BreakdownRow, WeekBucket } from '@/lib/dashboard'

// ── Tooltip ────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex ml-1 cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      role="button"
      aria-label={text}
    >
      <Info size={14} className="text-gray-400" />
      {show && (
        <span className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  )
}

// ── Small sample warning ───────────────────────────────────────────────

function SmallSample({ n, threshold = 5 }: { n: number; threshold?: number }) {
  if (n >= threshold) return <span className="text-xs text-gray-400 ml-1">(n={n})</span>
  return (
    <span className="text-xs text-amber-500 ml-1" title="Not enough data yet">
      (n={n}) ⚠
    </span>
  )
}

// ── Summary card ───────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
  tooltip,
  n,
  iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext?: string
  tooltip?: string
  n?: number
  iconColor: string
}) {
  return (
    <div className="relative bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Icon size={18} />
        </div>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1 flex items-center flex-wrap">
        {label}
        {n !== undefined && <SmallSample n={n} />}
      </p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  )
}

// ── Rate formatter ─────────────────────────────────────────────────────

function fmtRate(rate: number | null): string {
  if (rate === null) return '—'
  return `${Math.round(rate * 100)}%`
}

function fmtScore(score: number | null): string {
  if (score === null) return '—'
  return String(score)
}

// ── Bar chart (CSS-based) ──────────────────────────────────────────────

function WeeklyChart({ buckets }: { buckets: WeekBucket[] }) {
  const maxCount = Math.max(...buckets.map(b => b.count), 1)

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">Proposals per week (last 8 weeks)</h3>
      </div>
      <div className="flex items-end gap-2 h-36">
        {buckets.map((b) => {
          const height = maxCount > 0 ? (b.count / maxCount) * 100 : 0
          return (
            <div key={b.weekStart} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">{b.count}</span>
              <div className="w-full flex items-end" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t-md bg-indigo-500 hover:bg-indigo-600 transition-colors"
                  style={{
                    height: `${Math.max(height, b.count > 0 ? 4 : 0)}%`,
                    minHeight: b.count > 0 ? '4px' : '0px',
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 truncate w-full text-center">{b.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Breakdown table ────────────────────────────────────────────────────

function BreakdownTable({ title, icon: Icon, rows }: { title: string; icon: React.ElementType; rows: BreakdownRow[] }) {
  if (rows.length === 0) return null

  const hasScores = rows.some(r => r.avgScoreWon !== null || r.avgScoreNotWon !== null)

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">{title.includes('Platform') ? 'Platform' : 'Tone'}</th>
              <th className="pb-2 font-medium text-center">Submitted</th>
              <th className="pb-2 font-medium text-center">Replied</th>
              <th className="pb-2 font-medium text-center">Won</th>
              <th className="pb-2 font-medium text-center">
                Win Rate
                <InfoTooltip text="won / submitted" />
              </th>
              {hasScores && (
                <>
                  <th className="pb-2 font-medium text-center">Avg Score (Won)</th>
                  <th className="pb-2 font-medium text-center">Avg Score (Other)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5 font-medium text-gray-800 capitalize">{row.label}</td>
                <td className="py-2.5 text-center text-gray-600">{row.submitted}</td>
                <td className="py-2.5 text-center text-gray-600">{row.replied}</td>
                <td className="py-2.5 text-center text-gray-600">{row.won}</td>
                <td className="py-2.5 text-center">
                  <span className="inline-flex items-center">
                    {fmtRate(row.winRate)}
                    <SmallSample n={row.submitted} />
                  </span>
                </td>
                {hasScores && (
                  <>
                    <td className="py-2.5 text-center text-gray-600">{fmtScore(row.avgScoreWon)}</td>
                    <td className="py-2.5 text-center text-gray-600">{fmtScore(row.avgScoreNotWon)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-10 shadow-sm text-center">
      <div className="inline-flex p-4 rounded-full bg-indigo-50 mb-4">
        <FileText size={32} className="text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No submitted proposals yet</h3>
      <p className="text-sm text-gray-500 mb-1">
        Create your first proposal to start tracking your stats.
      </p>
      <p className="text-xs text-gray-400 mb-6">
        Tip: Update statuses in{' '}
        <Link href="/proposals" className="text-indigo-600 hover:text-indigo-700 underline">
          Proposals
        </Link>{' '}
        after sending them.
      </p>
      <Link
        href="/proposals/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Create Proposal <ArrowRight size={16} />
      </Link>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────

export default function DashboardContent({ data }: { data: DashboardData }) {
  const hasSubmitted = data.submitted > 0

  if (!hasSubmitted) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard
          icon={FileText}
          label="Total Proposals"
          value={String(data.total)}
          iconColor="bg-gray-100 text-gray-600"
        />
        <SummaryCard
          icon={Send}
          label="Submitted"
          value={String(data.submitted)}
          tooltip="Status is sent, replied, won, or lost"
          iconColor="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          icon={MessageSquare}
          label="Reply Rate"
          value={fmtRate(data.replyRate)}
          tooltip="(replied + won) / submitted"
          n={data.submitted}
          iconColor="bg-purple-50 text-purple-600"
        />
        <SummaryCard
          icon={Trophy}
          label="Win Rate"
          value={fmtRate(data.winRate)}
          tooltip="won / submitted"
          n={data.submitted}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          icon={Star}
          label="Avg Score"
          value={data.avgScore !== null ? String(data.avgScore) : '—'}
          subtext={data.scoredCount > 0 ? `${data.scoredCount} scored` : 'No scores yet'}
          n={data.scoredCount > 0 ? data.scoredCount : undefined}
          iconColor="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Weekly chart */}
      <WeeklyChart buckets={data.weekly} />

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownTable
          title="By Platform"
          icon={TrendingUp}
          rows={data.byPlatform}
        />
        <BreakdownTable
          title="By Tone"
          icon={TrendingUp}
          rows={data.byTone}
        />
      </div>
    </div>
  )
}
