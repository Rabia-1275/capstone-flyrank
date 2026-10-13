import Link from 'next/link'
import { FileQuestion, ArrowLeft, LayoutDashboard } from 'lucide-react'

export const metadata = {
  title: 'Page Not Found',
  description: 'The requested page could not be found.',
}

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-4 rounded-full bg-indigo-50 border border-indigo-100 mb-5 text-[var(--primary)]">
        <FileQuestion className="w-12 h-12" />
      </div>
      <span className="text-xs font-mono font-semibold tracking-wider text-[var(--primary)] uppercase mb-2">
        404 Error
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">
        Page Not Found
      </h1>
      <p className="text-sm sm:text-base text-[var(--muted)] max-w-md mb-8">
        The page you are looking for doesn&apos;t exist, has been removed, or the link may be broken.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 rounded-[var(--radius)] transition-opacity shadow-xs"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-[var(--radius)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
