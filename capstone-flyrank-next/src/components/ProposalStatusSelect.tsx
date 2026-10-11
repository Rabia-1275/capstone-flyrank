'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

export type ProposalStatus = 'draft' | 'sent' | 'replied' | 'won' | 'lost'

interface ProposalStatusSelectProps {
  proposalId: string
  currentStatus: ProposalStatus | string
  onStatusChange?: (newStatus: ProposalStatus) => void
  disabled?: boolean
  className?: string
}

const STATUS_CONFIG: Record<ProposalStatus, { label: string; badgeClass: string }> = {
  draft: {
    label: 'Draft',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300 focus:ring-gray-400',
  },
  sent: {
    label: 'Sent',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400',
  },
  replied: {
    label: 'Replied',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-400',
  },
  won: {
    label: 'Won',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400',
  },
  lost: {
    label: 'Lost',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400',
  },
}

export function getStatusBadgeClass(status: string) {
  const normalized = (status?.toLowerCase() || 'draft') as ProposalStatus
  return STATUS_CONFIG[normalized]?.badgeClass || 'bg-gray-100 text-gray-700 border-gray-300'
}

export default function ProposalStatusSelect({
  proposalId,
  currentStatus,
  onStatusChange,
  disabled = false,
  className = '',
}: ProposalStatusSelectProps) {
  const [status, setStatus] = useState<ProposalStatus>(
    ((currentStatus?.toLowerCase() as ProposalStatus) || 'draft') in STATUS_CONFIG
      ? (currentStatus?.toLowerCase() as ProposalStatus)
      : 'draft'
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as ProposalStatus
    const previousStatus = status

    // Optimistic UI update
    setStatus(nextStatus)
    setErrorMessage(null)
    setIsUpdating(true)
    if (onStatusChange) {
      onStatusChange(nextStatus)
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('proposals')
        .update({ status: nextStatus })
        .eq('id', proposalId)

      if (error) {
        throw new Error(error.message)
      }
    } catch (err: unknown) {
      // Rollback on error
      setStatus(previousStatus)
      if (onStatusChange) {
        onStatusChange(previousStatus)
      }
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG.draft

  return (
    <div className={`inline-flex flex-col items-start ${className}`} onClick={(e) => e.stopPropagation()}>
      <div className="relative inline-flex items-center">
        <label htmlFor={`proposal-status-select-${proposalId}`} className="sr-only">
          Proposal Status
        </label>
        <select
          id={`proposal-status-select-${proposalId}`}
          value={status}
          onChange={handleChange}
          disabled={disabled || isUpdating}
          className={`appearance-none text-xs font-semibold px-2.5 py-1 pr-6 rounded-full border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed ${currentConfig.badgeClass}`}
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="replied">Replied</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin text-current opacity-70" />
          ) : (
            <svg
              className="h-3 w-3 text-current opacity-70"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      {errorMessage && (
        <span className="text-[10px] text-red-600 mt-0.5 leading-tight">{errorMessage}</span>
      )}
    </div>
  )
}
