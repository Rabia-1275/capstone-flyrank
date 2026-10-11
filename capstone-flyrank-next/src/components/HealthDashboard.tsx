'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Database,
  Sparkles,
  Activity,
} from 'lucide-react'

export type HealthData = {
  status: 'ok' | 'degraded' | 'error'
  supabase_reachable: boolean
  ai_configured: boolean
  timestamp: string
}

export default function HealthDashboard({
  initialData,
}: {
  initialData: HealthData
}) {
  const [data, setData] = useState<HealthData>(initialData)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(
    new Date(initialData.timestamp)
  )

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health', {
        cache: 'no-store',
      })
      const json: HealthData = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch {
      setData((prev) => ({
        ...prev,
        status: 'error',
        supabase_reachable: false,
        timestamp: new Date().toISOString(),
      }))
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh timer (every 10 seconds)
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchHealth()
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchHealth])

  const isAppOk = data.status === 'ok'
  const isSupabaseOk = data.supabase_reachable
  const isAiOk = data.ai_configured

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-[var(--radius)] border border-gray-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                isAppOk ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {isAppOk ? 'All Systems Operational' : 'Degraded Performance'}
            </span>
          </div>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="text-xs text-[var(--muted)] w-full sm:w-auto">
            Last checked:{' '}
            <time dateTime={lastUpdated.toISOString()}>
              {lastUpdated.toLocaleTimeString()}
            </time>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            Auto-refresh: {autoRefresh ? 'ON (10s)' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:opacity-90 rounded-[var(--radius)] transition-opacity disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: App Status */}
        <div
          className={`p-6 rounded-[var(--radius)] border shadow-xs transition-colors ${
            isAppOk
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'bg-red-50/40 border-red-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  isAppOk
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[var(--foreground)]">
                  Application Status
                </h3>
                <p className="text-xs text-[var(--muted)]">Core Web Services</p>
              </div>
            </div>
            {isAppOk ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> OK
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <XCircle className="w-3.5 h-3.5" /> Error
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            {isAppOk
              ? 'Web application is running and responding to incoming HTTP traffic normally.'
              : 'The application core is reporting an error or degraded dependency state.'}
          </p>
        </div>

        {/* Card 2: Supabase Reachability */}
        <div
          className={`p-6 rounded-[var(--radius)] border shadow-xs transition-colors ${
            isSupabaseOk
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'bg-red-50/40 border-red-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  isSupabaseOk
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[var(--foreground)]">
                  Supabase Connectivity
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Database & Auth API
                </p>
              </div>
            </div>
            {isSupabaseOk ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reachable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <XCircle className="w-3.5 h-3.5" /> Unreachable
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            {isSupabaseOk
              ? 'Lightweight ping succeeded. Postgres database and auth services are reachable.'
              : 'Unable to reach Supabase backend. Please check network connectivity and Supabase project state.'}
          </p>
        </div>

        {/* Card 3: AI Service Configuration */}
        <div
          className={`p-6 rounded-[var(--radius)] border shadow-xs transition-colors ${
            isAiOk
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'bg-red-50/40 border-red-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  isAiOk
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[var(--foreground)]">
                  AI Service Configuration
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Groq API Integration
                </p>
              </div>
            </div>
            {isAiOk ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <XCircle className="w-3.5 h-3.5" /> Not Configured
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            {isAiOk
              ? 'API credentials are set in environment variables. AI analysis and generation ready.'
              : 'GROQ_API_KEY is not defined in server environment variables. AI generation will fail.'}
          </p>
        </div>

        {/* Card 4: Server Time */}
        <div className="p-6 rounded-[var(--radius)] border border-gray-200 bg-white shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gray-100 text-gray-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[var(--foreground)]">
                  Server Time
                </h3>
                <p className="text-xs text-[var(--muted)]">UTC System Clock</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 font-mono">
              Synchronized
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-sm font-mono text-[var(--foreground)] truncate">
              {data.timestamp}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Local: {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
