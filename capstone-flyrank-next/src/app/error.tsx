'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log minimal safe diagnostic
    console.error('Unhandled app error:', error.message)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-4 rounded-full bg-red-50 border border-red-100 mb-5 text-red-600">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <span className="text-xs font-mono font-semibold tracking-wider text-red-600 uppercase mb-2">
        Application Error
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">
        Something went wrong
      </h1>
      <p className="text-sm sm:text-base text-[var(--muted)] max-w-md mb-8">
        An unexpected error occurred while rendering this page. You can try reloading or return home.
      </p>

      {error.digest && (
        <p className="text-xs font-mono text-gray-400 mb-6 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 rounded-[var(--radius)] transition-opacity shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-[var(--radius)] transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
