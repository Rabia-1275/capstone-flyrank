'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, AlertTriangle, HelpCircle, DollarSign, Copy, Check, Loader2, X, ChevronDown } from 'lucide-react'

type Analysis = {
  summary: string
  client_needs: string[]
  required_skills: string[]
  skill_match: { matched: string[]; gaps: string[] }
  red_flags: string[]
  clarifying_questions: string[]
  pricing: { model: string; low: number; high: number; currency: string; timeline_days: number; reasoning: string }
}

type ProposalEditorProps = {
  proposalId: string
  initialText: string
  analysis: Analysis
  initialTone: string
  profile: any
  projects: any[]
}

export default function ProposalEditor({ proposalId, initialText, analysis, initialTone, profile, projects }: ProposalEditorProps) {
  const [tone, setTone] = useState(initialTone)
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [text, setText] = useState(initialText)
  const [savedText, setSavedText] = useState(initialText)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isManualStop = useRef(false)
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null)

  // Debounced autosave
  useEffect(() => {
    if (text === savedText) return
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current)
    autosaveTimeout.current = setTimeout(() => {
      saveProposal()
    }, 2000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const saveProposal = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_text: text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedText(text)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const startGeneration = async () => {
    if (text.trim() !== '') {
      if (!window.confirm('This will replace your current proposal text. Are you sure you want to regenerate?')) {
        return
      }
    }
    
    setText('')
    setGenerating(true)
    setError(null)
    isManualStop.current = false
    
    const executeFetch = async (retryCount: number): Promise<void> => {
      abortControllerRef.current = new AbortController()
      let firstTokenReceived = false
      
      const watchdog = setTimeout(() => {
        if (!firstTokenReceived && !isManualStop.current) {
          abortControllerRef.current?.abort()
        }
      }, 20000)

      try {
        const res = await fetch(`/api/proposals/${proposalId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tone, length }),
          signal: abortControllerRef.current.signal
        })

        if (!res.ok) {
          clearTimeout(watchdog)
          const err = await res.json()
          if (res.status === 429) throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
          if (res.status === 401 || res.status === 403) throw new Error('Authentication error. Please log in again.')
          if (res.status === 504 || res.status === 408) throw new Error('The server timed out. Please try again.')
          throw new Error(err.error || 'Generation failed')
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let done = false

        while (!done) {
          const { value, done: doneReading } = await reader!.read()
          if (!firstTokenReceived) {
            firstTokenReceived = true
            clearTimeout(watchdog)
          }
          done = doneReading
          if (value) {
            const chunk = decoder.decode(value)
            setText((prev: string) => prev + chunk)
          }
        }
      } catch (e: any) {
        clearTimeout(watchdog)
        if (e.name === 'AbortError') {
          if (!isManualStop.current) {
            setError('The AI took too long. Please try again')
          }
          return
        }
        
        if (e.message.includes('fetch') || e.message.includes('Network') || e.name === 'TypeError') {
           if (retryCount > 0) {
             console.log('Connection error, retrying...')
             return executeFetch(retryCount - 1)
           } else {
             setError('Connection error. Please check your internet and try again.')
             return
           }
        }
        
        setError(e.message)
      }
    }
    
    await executeFetch(1)
    setGenerating(false)
    abortControllerRef.current = null
  }

  const stopGeneration = () => {
    isManualStop.current = true
    abortControllerRef.current?.abort()
    setGenerating(false)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  return (
    <div className="flex flex-col gap-6">
      <details className="group mb-6">
        <summary className="bg-[var(--background)] p-4 rounded-[var(--radius)] border border-gray-200 shadow-sm cursor-pointer font-bold text-xl flex justify-between items-center list-none select-none">
          Job Analysis
          <ChevronDown className="transition-transform group-open:rotate-180" />
        </summary>
        
        <div className="flex flex-col gap-6 mt-6">
          <div className="bg-[var(--background)] p-6 rounded-[var(--radius)] border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-2">Summary</h2>
            <p className="text-[var(--foreground)] leading-relaxed">{analysis.summary}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--background)] p-6 rounded-[var(--radius)] border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-500" /> Skill Match
              </h2>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Matched</h3>
                <ul className="list-disc pl-5 text-[var(--foreground)]">
                  {analysis.skill_match.matched.length > 0 ? analysis.skill_match.matched.map((s, i) => <li key={i}>{s}</li>) : <li className="text-gray-400 italic">None</li>}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Gaps</h3>
                <ul className="list-disc pl-5 text-red-600">
                  {analysis.skill_match.gaps.length > 0 ? analysis.skill_match.gaps.map((s, i) => <li key={i}>{s}</li>) : <li className="text-gray-400 italic">None</li>}
                </ul>
              </div>
            </div>
            <div className="bg-[var(--background)] p-6 rounded-[var(--radius)] border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Red Flags
              </h2>
              {analysis.red_flags.length > 0 ? (
                <ul className="list-disc pl-5 text-red-600 space-y-1">
                  {analysis.red_flags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              ) : (
                <p className="text-green-600">No major red flags detected!</p>
              )}
            </div>
          </div>
          <div className="bg-[var(--background)] p-6 rounded-[var(--radius)] border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <HelpCircle className="text-blue-500" /> Clarifying Questions
            </h2>
            <div className="flex flex-col gap-3">
              {analysis.clarifying_questions.map((q, i) => (
                <div key={i} className="flex justify-between items-start bg-blue-50 p-3 rounded-[var(--radius)] border border-blue-100">
                  <span className="text-blue-900 pr-4">{q}</span>
                  <button onClick={() => navigator.clipboard.writeText(q)} className="text-blue-500 hover:text-blue-700 p-1" title="Copy question">
                    <Copy size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--background)] p-6 rounded-[var(--radius)] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <DollarSign className="text-yellow-500" /> AI Estimate
              </h2>
              <p className="text-[var(--foreground)] text-lg">
                <span className="font-semibold capitalize">{analysis.pricing.model}</span>: ${analysis.pricing.low} - ${analysis.pricing.high} {analysis.pricing.currency}
              </p>
              <p className="text-sm text-[var(--muted)]">Timeline: {analysis.pricing.timeline_days} days</p>
              <p className="text-sm text-gray-500 mt-2 italic">{analysis.pricing.reasoning}</p>
            </div>
          </div>
        </div>
      </details>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <select value={tone} onChange={e => setTone(e.target.value)} className="p-2 border rounded-[var(--radius)]">
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="confident">Confident</option>
          <option value="concise">Concise</option>
        </select>
        <select value={length} onChange={e => setLength(e.target.value as any)} className="p-2 border rounded-[var(--radius)]">
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
        {generating ? (
          <button onClick={stopGeneration} className="bg-red-600 text-white px-4 py-2 rounded-[var(--radius)] font-medium hover:opacity-90 flex items-center gap-2">
            <X size={16} /> Stop
          </button>
        ) : (
          <button onClick={startGeneration} disabled={generating} className="bg-[var(--primary)] text-white px-4 py-2 rounded-[var(--radius)] font-medium hover:opacity-90 flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Generate
          </button>
        )}
      </div>

      {/* Editable textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full h-64 p-4 border rounded-[var(--radius)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
        />
        <div className="absolute bottom-2 right-2 text-sm text-[var(--muted)]">
          {wordCount} words / {charCount} chars
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 items-center">
        <button onClick={copyToClipboard} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-[var(--radius)] flex items-center gap-2">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={saveProposal} className="bg-[var(--primary)] text-white px-4 py-2 rounded-[var(--radius)] font-medium hover:opacity-90">
          Save
        </button>
        {text !== savedText && (
          <span className="text-red-500 italic">Unsaved changes</span>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <span>{error}</span>
            {error === 'The AI took too long. Please try again' && (
              <button onClick={startGeneration} className="underline font-bold hover:text-red-800">
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
