'use client'

import { useState } from 'react'
import { signup } from '@/app/auth/actions'
import Link from 'next/link'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md mt-10 p-4 sm:p-6 border border-gray-200 rounded-[var(--radius)] bg-[var(--background)] shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Sign Up</h1>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-[var(--radius)]">{error}</div>}
      
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]" htmlFor="email">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]" htmlFor="password">Password</label>
          <input 
            id="password" 
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
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
      <div className="mt-4 text-sm text-center text-[var(--muted)]">
        Already have an account? <Link href="/login" className="text-[var(--primary)] hover:underline">Log in</Link>
      </div>
    </div>
  )
}
