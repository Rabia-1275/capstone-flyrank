'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, AlertTriangle, HelpCircle, DollarSign, Copy, Check, Loader2, Sparkles, ChevronDown, Award, RefreshCw, AlertCircle } from 'lucide-react'

type Analysis = {
  summary: string
  client_needs: string[]
  required_skills: string[]
  skill_match: { matched: string[]; gaps: string[] }
  red_flags: string[]
  clarifying_questions: string[]
  pricing: { model: string; low: number; high: number; currency: string; timeline_days: number; reasoning: string }
}

type ScoreBreakdownItem = {
  score: number
  feedback: string
}

type ProposalScoreData = {
  overall: number
  breakdown: {
    hook: ScoreBreakdownItem
    relevance: ScoreBreakdownItem
    specificity: ScoreBreakdownItem
    clarity_length: ScoreBreakdownItem
    call_to_action: ScoreBreakdownItem
  }
  strengths: string[]
  improvements: string[]
  unsupported_claims: string[]
  better_opening: string
  text_hash?: string
  scored_at?: string
}

type ProposalEditorProps = {
  proposalId: string
  initialText: string
  analysis: Analysis
  initialTone: string
  profile?: Record<string, unknown> | null
  projects?: Array<Record<string, unknown>> | null
  initialScore?: ProposalScoreData | null
}

export default function ProposalEditor({ proposalId, initialText, analysis, initialTone, initialScore }: ProposalEditorProps) {
  const [tone, setTone] = useState(initialTone)
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [text, setText] = useState(initialText)
  const [savedText, setSavedText] = useState(initialText)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [score, setScore] = useState<ProposalScoreData | null>(
    initialScore && typeof initialScore === 'object' && 'overall' in initialScore ? initialScore : null
  )
  const [scoring, setScoring] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [copiedOpening, setCopiedOpening] = useState(false)
  const [currentTextHash, setCurrentTextHash] = useState<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const isManualStop = useRef(false)
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let isMounted = true
    const computeHash = async () => {
      if (!text.trim()) {
        if (isMounted) setCurrentTextHash('')
        return
      }
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
          const encoder = new TextEncoder()
          const data = encoder.encode(text.trim())
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
          if (isMounted) setCurrentTextHash(hex)
        } catch {
          // Ignore subtle crypto failures
        }
      }
    }
    computeHash()
    return () => {
      isMounted = false
    }
  }, [text])

  const isScoreOutOfDate = Boolean(
    score && score.text_hash && currentTextHash && score.text_hash !== currentTextHash
  )

  const saveProposal = async () => {
    if (text.trim() === '') return
    try {
      const res = await fetch(`/api/proposals/${proposalId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_text: text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedText(text)
    } catch (e: unknown) {
      const err = e as Error
      setError(err.message || 'Save failed')
    }
  }

  // Debounced autosave
  useEffect(() => {
    if (generating || text === savedText || text.trim() === '') return
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current)
    autosaveTimeout.current = setTimeout(() => {
      saveProposal()
    }, 2000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, generating])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleScoreProposal = async (force: boolean = false) => {
    if (!text.trim() || scoring) return
    setScoring(true)
    setScoreError(null)

    try {
      if (text !== savedText && text.trim() !== '') {
        await saveProposal()
      }

      const res = await fetch(`/api/proposals/${proposalId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force, proposal_text: text })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 429) throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
        if (res.status === 401 || res.status === 403) throw new Error('Authentication error. Please log in again.')
        if (res.status === 504 || res.status === 408) throw new Error('The server timed out. Please try again.')
        throw new Error(data?.error || 'Failed to score proposal')
      }

      setScore(data)
    } catch (err: unknown) {
      const e = err as Error
      setScoreError(e.message || 'Failed to score proposal')
    } finally {
      setScoring(false)
    }
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
          const err = await res.json().catch(() => ({}))
          if (res.status === 429) throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
          if (res.status === 401 || res.status === 403) throw new Error('Authentication error. Please log in again.')
          if (res.status === 504 || res.status === 408) throw new Error('The server timed out. Please try again.')
          throw new Error(err?.error || 'Generation failed')
        }

        const reader = res.body?.getReader()
        if (!reader) {
          throw new Error('No response stream available')
        }

        const decoder = new TextDecoder()
        let receivedChars = 0

        while (true) {
          const { value, done: doneReading } = await reader.read()
          if (doneReading) break
          if (value) {
            if (!firstTokenReceived) {
              firstTokenReceived = true
              clearTimeout(watchdog)
            }
            const chunk = decoder.decode(value, { stream: true })
            receivedChars += chunk.length
            setText((prev: string) => prev + chunk)
          }
        }

        clearTimeout(watchdog)

        const finalChunk = decoder.decode()
        if (finalChunk) {
          receivedChars += finalChunk.length
          setText((prev: string) => prev + finalChunk)
        }

        if (receivedChars === 0 && !isManualStop.current) {
          throw new Error('The AI returned no text. Please try again.')
        }
      } catch (err: unknown) {
        const e = err as Error
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
        <select value={length} onChange={e => setLength(e.target.value as 'short' | 'medium' | 'long')} className="p-2 border rounded-[var(--radius)]">
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
        {generating ? (
          <button onClick={stopGeneration} className="bg-red-600 text-white px-4 py-2 rounded-[var(--radius)] font-medium hover:opacity-90 flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Stop
          </button>
        ) : (
          <button onClick={startGeneration} disabled={generating} className="bg-[var(--primary)] text-white px-4 py-2 rounded-[var(--radius)] font-medium hover:opacity-90 flex items-center gap-2">
            <Sparkles size={16} /> Generate
          </button>
        )}
      </div>

      {/* Error box */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[var(--radius)] flex items-center justify-between gap-4 text-red-700">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => startGeneration()}
            className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

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
      <div className="flex flex-wrap gap-4 items-center">
        <button onClick={copyToClipboard} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-[var(--radius)] flex items-center gap-2">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={saveProposal} className="bg-[var(--primary)] text-white px-4 py-2 rounded-[var(--radius)] font-medium hover:opacity-90">
          Save
        </button>
        <button
          onClick={() => handleScoreProposal(false)}
          disabled={!text.trim() || scoring || generating}
          className="bg-indigo-600 text-white px-4 py-2 rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition"
        >
          {scoring ? <Loader2 className="animate-spin" size={16} /> : <Award size={16} />}
          {scoring ? 'Scoring...' : 'Score proposal'}
        </button>
        {text !== savedText && (
          <span className="text-red-500 italic">Unsaved changes</span>
        )}
      </div>

      {/* Score Error Banner */}
      {scoreError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[var(--radius)] flex items-center justify-between gap-4 text-red-700">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span className="text-sm font-medium">{scoreError}</span>
          </div>
          <button
            onClick={() => handleScoreProposal(true)}
            className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Score Loading State */}
      {scoring && (
        <div className="bg-[var(--background)] border border-indigo-200 rounded-[var(--radius)] p-6 shadow-sm flex items-center justify-center gap-3 text-indigo-700 animate-pulse">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-medium">Analyzing proposal against job requirements and your profile...</span>
        </div>
      )}

      {/* Score Results Card */}
      {score && (
        <div className="bg-[var(--background)] border border-gray-200 rounded-[var(--radius)] p-6 shadow-sm space-y-6">
          {/* Header with Title, Out-of-date notice, and Overall Score Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Award className="text-indigo-600" size={22} />
                  Proposal Score & Feedback
                </h2>
                {isScoreOutOfDate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle size={14} />
                    Score is out of date
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Objective evaluation based strictly on job requirements and verified profile data.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isScoreOutOfDate && (
                <button
                  onClick={() => handleScoreProposal(true)}
                  disabled={scoring || generating}
                  className="text-xs px-3 py-1.5 font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {scoring ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                  Re-score
                </button>
              )}
              <div className={`px-4 py-2 rounded-xl border text-center font-bold ${
                score.overall >= 80
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : score.overall >= 60
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <div className="text-2xl leading-none">{score.overall}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-75 mt-0.5">Overall / 100</div>
              </div>
            </div>
          </div>

          {/* Five Breakdown Rows with bars and feedback */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Breakdown</h3>
            <div className="grid grid-cols-1 gap-3.5">
              {[
                { key: 'hook', label: 'Hook & Opening Impression', item: score.breakdown?.hook },
                { key: 'relevance', label: 'Relevance to Job Description', item: score.breakdown?.relevance },
                { key: 'specificity', label: 'Specificity & Real Proof', item: score.breakdown?.specificity },
                { key: 'clarity_length', label: 'Clarity, Tone & Length', item: score.breakdown?.clarity_length },
                { key: 'call_to_action', label: 'Call to Action & Next Step', item: score.breakdown?.call_to_action },
              ].map(({ key, label, item }) => {
                if (!item) return null
                const pct = Math.min(100, Math.max(0, (item.score / 10) * 100))
                const barColor =
                  item.score >= 8
                    ? 'bg-emerald-500'
                    : item.score >= 6
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                return (
                  <div key={key} className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--foreground)]">{label}</span>
                      <span className="font-bold text-gray-700">{item.score} / 10</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.feedback}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Strengths */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle size={16} className="text-emerald-600" /> Key Strengths
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {score.strengths && score.strengths.length > 0 ? (
                  score.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">None noted</li>
                )}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                <HelpCircle size={16} className="text-amber-600" /> Improvement Opportunities
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {score.improvements && score.improvements.length > 0 ? (
                  score.improvements.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">None noted</li>
                )}
              </ul>
            </div>
          </div>

          {/* Unsupported Claims Warning List */}
          {score.unsupported_claims && score.unsupported_claims.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-rose-600" />
                Unsupported Claims
              </h4>
              <p className="text-xs text-rose-700">
                These statements in your proposal are not supported by skills or projects in your profile:
              </p>
              <ul className="space-y-1 text-xs text-rose-900 list-disc list-inside">
                {score.unsupported_claims.map((claim, idx) => (
                  <li key={idx} className="leading-relaxed font-medium">{claim}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Better Opening with Copy Button */}
          {score.better_opening && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-blue-600" />
                  Suggested Better Opening
                </h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(score.better_opening)
                    setCopiedOpening(true)
                    setTimeout(() => setCopiedOpening(false), 1500)
                  }}
                  className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1 font-medium"
                >
                  {copiedOpening ? <Check size={14} /> : <Copy size={14} />}
                  {copiedOpening ? 'Copied' : 'Copy opening'}
                </button>
              </div>
              <p className="text-xs text-blue-950 italic leading-relaxed bg-white/70 p-3 rounded border border-blue-100">
                &ldquo;{score.better_opening}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
