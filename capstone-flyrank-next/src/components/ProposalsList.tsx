'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import ProposalStatusSelect, { ProposalStatus } from '@/components/ProposalStatusSelect'
import {
  Plus,
  Search,
  Trash2,
  FileText,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react'
import { formatPlatformName } from '@/lib/format'

export interface ProposalItem {
  id: string
  user_id: string
  platform: string
  job_text: string
  status: ProposalStatus | string
  proposal_text: string | null
  score: number | Record<string, unknown> | null
  created_at: string
}

const PLATFORM_BADGE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  upwork: {
    label: 'Upwork',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  fiverr: {
    label: 'Fiverr',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
  },
  freelancer: {
    label: 'Freelancer',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  peopleperhour: {
    label: 'PeoplePerHour',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  custom: {
    label: 'Custom',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

function getPlatformBadge(platform: string) {
  const normalized = platform?.toLowerCase() || 'custom'
  const config = PLATFORM_BADGE_CONFIG[normalized]
  const label = formatPlatformName(platform)
  if (config) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.badgeClass}`}>
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
      {label}
    </span>
  )
}

function formatDate(isoDate: string) {
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

export default function ProposalsList() {
  const router = useRouter()
  const [proposals, setProposals] = useState<ProposalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ProposalItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      // Query proposals for this user, newest first (proposals table has RLS policy user_id = auth.uid())
      const { data, error: fetchErr } = await supabase
        .from('proposals')
        .select('id, user_id, platform, job_text, status, proposal_text, score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchErr) {
        throw new Error(fetchErr.message)
      }

      setProposals((data as ProposalItem[]) || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    let ignore = false
    async function init() {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        const { data, error: fetchErr } = await supabase
          .from('proposals')
          .select('id, user_id, platform, job_text, status, proposal_text, score, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchErr) {
          throw new Error(fetchErr.message)
        }

        if (!ignore) {
          setProposals((data as ProposalItem[]) || [])
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load proposals')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      ignore = true
    }
  }, [router])

  // Optimistic local status update when a child ProposalStatusSelect changes
  const handleOptimisticStatusChange = (id: string, newStatus: ProposalStatus) => {
    setProposals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )
  }

  // Delete handler
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const supabase = createClient()
      const { error: delErr } = await supabase
        .from('proposals')
        .delete()
        .eq('id', deleteTarget.id)

      if (delErr) {
        throw new Error(delErr.message)
      }

      // Remove from state
      setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete proposal')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      // Status filter
      if (statusFilter !== 'all' && (p.status || 'draft').toLowerCase() !== statusFilter.toLowerCase()) {
        return false
      }
      // Platform filter
      if (platformFilter !== 'all' && (p.platform || 'custom').toLowerCase() !== platformFilter.toLowerCase()) {
        return false
      }
      // Text search in job_text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const text = (p.job_text || '').toLowerCase()
        if (!text.includes(query)) {
          return false
        }
      }
      return true
    })
  }, [proposals, statusFilter, platformFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Proposals</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage your AI-crafted proposals, track submissions, and monitor outcomes.
          </p>
        </div>
        <div>
          <Link
            href="/proposals/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            New proposal
          </Link>
        </div>
      </div>

      {/* Controls: Search & Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <label htmlFor="search-proposals" className="sr-only">
            Search job text
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="search-proposals"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job description snippet..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-status" className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" />
              Status:
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="replied">Replied</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filter-platform" className="text-xs font-medium text-gray-500">
              Platform:
            </label>
            <select
              id="filter-platform"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="all">All platforms</option>
              <option value="upwork">Upwork</option>
              <option value="fiverr">Fiverr</option>
              <option value="freelancer">Freelancer</option>
              <option value="peopleperhour">PeoplePerHour</option>
              <option value="custom">Custom / Other</option>
            </select>
          </div>

          {(statusFilter !== 'all' || platformFilter !== 'all' || searchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setPlatformFilter('all')
                setSearchQuery('')
              }}
              className="text-xs text-[var(--primary)] underline underline-offset-2 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main List Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-3" aria-busy="true" aria-label="Loading proposals">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-gray-200 rounded"></div>
                  <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 shadow-sm">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
          <h2 className="text-base font-semibold">Error Loading Proposals</h2>
          <p className="text-sm mt-1 text-red-600">{error}</p>
          <button
            onClick={fetchProposals}
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : proposals.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-[var(--primary)] mb-4">
            <FileText className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">No proposals yet</h2>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto mt-2">
            You haven&apos;t created any proposals yet. Paste your first job post to generate tailored pitches and win more clients.
          </p>
          <div className="mt-6">
            <Link
              href="/proposals/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Create your first proposal
            </Link>
          </div>
        </div>
      ) : filteredProposals.length === 0 ? (
        /* No Search / Filter Matches */
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm">
          <Layers className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm font-medium">No proposals match your current filters.</p>
          <button
            onClick={() => {
              setStatusFilter('all')
              setPlatformFilter('all')
              setSearchQuery('')
            }}
            className="mt-2 text-xs text-[var(--primary)] underline underline-offset-2 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Proposals Table / List */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
          {filteredProposals.map((item) => {
            const hasGeneratedText = Boolean(item.proposal_text && item.proposal_text.trim().length > 0)
            const snippet = item.job_text
              ? item.job_text.length > 80
                ? `${item.job_text.slice(0, 80)}…`
                : item.job_text
              : 'No job text provided'

            return (
              <div
                key={item.id}
                className="group p-4 sm:p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left block: details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {getPlatformBadge(item.platform)}

                    {/* Has generated text badge */}
                    {hasGeneratedText ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Sparkles className="h-3 w-3" />
                        Generated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        No Draft
                      </span>
                    )}

                    {/* Score badge if score exists */}
                    {(() => {
                      const numericScore = typeof item.score === 'number' ? item.score : item.score?.overall
                      if (typeof numericScore !== 'number' || isNaN(numericScore)) return null
                      const badgeColor =
                        numericScore >= 80
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : numericScore >= 60
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badgeColor}`}>
                          Score: {numericScore}
                        </span>
                      )
                    })()}

                    {/* Created date */}
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  {/* Job snippet linking to proposal detail */}
                  <Link
                    href={`/proposals/${item.id}`}
                    className="block text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2"
                  >
                    {snippet}
                  </Link>
                </div>

                {/* Right block: Status select & actions */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap md:flex-nowrap shrink-0 self-start md:self-center">
                  {/* Status control */}
                  <ProposalStatusSelect
                    proposalId={item.id}
                    currentStatus={item.status || 'draft'}
                    onStatusChange={(newStatus) => handleOptimisticStatusChange(item.id, newStatus)}
                  />

                  {/* Link to detail */}
                  <Link
                    href={`/proposals/${item.id}`}
                    className="p-1.5 text-gray-600 hover:text-[var(--primary)] rounded-md hover:bg-gray-100 transition-colors"
                    title="View proposal detail"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View detail</span>
                  </Link>

                  {/* Delete button */}
                  <button
                    onClick={() => {
                      setDeleteTarget(item)
                      setDeleteError(null)
                    }}
                    className="p-1.5 text-gray-600 hover:text-rose-700 rounded-md hover:bg-rose-50 transition-colors"
                    title="Delete proposal"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-full bg-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 id="delete-modal-title" className="text-lg font-bold text-gray-900">
                Delete Proposal
              </h2>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to delete this proposal? This action cannot be undone.
            </p>

            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 italic border border-gray-200 line-clamp-3">
              &ldquo;{deleteTarget.job_text?.slice(0, 140) || 'Untitled Proposal'}&rdquo;
            </div>

            {deleteError && (
              <p className="text-xs text-rose-600 font-medium">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
