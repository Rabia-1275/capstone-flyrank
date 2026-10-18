'use client'

import { useId, useState } from 'react'
import { login } from '@/app/auth/actions'
import Link from 'next/link'

export default function LoginPage() {
  const fieldId = useId()
  const emailId = `${fieldId}-email`
  const passwordId = `${fieldId}-password`
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md mt-10 p-4 sm:p-6 border border-gray-200 rounded-[var(--radius)] bg-[var(--background)] shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Login</h1>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-[var(--radius)]">{error}</div>}
      
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]" htmlFor={emailId}>Email</label>
          <input 
            id={emailId} 
            name="email" 
            type="email" 
            required 
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]" htmlFor={passwordId}>Password</label>
          <input 
            id={passwordId} 
            name="password" 
            type="password" 
            required 
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[var(--primary)] text-white p-2 rounded-[var(--radius)] mt-2 hover:opacity-90 disabled:opacity-50 font-medium"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <div className="mt-4 text-sm text-center text-[var(--muted)]">
        Don&apos;t have an account? <Link href="/signup" className="text-[var(--primary)] underline underline-offset-2">Sign up</Link>
      </div>
    </div>
  )
}
