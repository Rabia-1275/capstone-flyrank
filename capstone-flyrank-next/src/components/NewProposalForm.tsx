'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertTriangle, HelpCircle, DollarSign, Copy, Check } from 'lucide-react'

type Analysis = {
  summary: string
  client_needs: string[]
  required_skills: string[]
  skill_match: { matched: string[], gaps: string[] }
  red_flags: string[]
  clarifying_questions: string[]
  pricing: { model: string, low: number, high: number, currency: string, timeline_days: number, reasoning: string }
}

export default function NewProposalForm({ emptyProfile }: { emptyProfile: boolean }) {
  const router = useRouter()
  const [platform, setPlatform] = useState('upwork')
  const [jobText, setJobText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [copiedQuestion, setCopiedQuestion] = useState<number | null>(null)
  const [proposalId, setProposalId] = useState<string | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, jobText })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze job')
      }
      
      setAnalysis(data.analysis)
      setProposalId(data.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedQuestion(index)
    setTimeout(() => setCopiedQuestion(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {emptyProfile && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-[var(--radius)] border border-yellow-200">
          <AlertTriangle className="inline mr-2" size={20} />
          Your profile is mostly empty! To get the best analysis and proposals, please <a href="/profile" className="underline font-bold">complete your profile</a> first.
        </div>
      )}

      <form onSubmit={handleAnalyze} className="bg-[var(--background)] p-6 rounded-[var(--radius)] border border-gray-200 shadow-sm flex flex-col gap-4">
        <div>
          <label htmlFor="platform" className="block text-sm font-medium mb-1 text-[var(--foreground)]">Platform</label>
          <select 
            id="platform"
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)]"
          >
            <option value="upwork">Upwork</option>
            <option value="fiverr">Fiverr</option>
            <option value="freelancer">Freelancer</option>
            <option value="peopleperhour">PeoplePerHour</option>
          </select>
        </div>

        <div>
          <label htmlFor="job-description" className="flex justify-between text-sm font-medium mb-1 text-[var(--foreground)]">
            <span>Job Description</span>
            <span className={`${jobText.length > 8000 ? 'text-red-500' : 'text-[var(--muted)]'}`}>
              {jobText.length}/8000
            </span>
          </label>
          <textarea 
            id="job-description"
            value={jobText} 
            onChange={(e) => setJobText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)] h-48"
            placeholder="Paste the job description here..."
            required
            maxLength={8500}
          />
        </div>

        {error && (
          <div role="alert" className="p-3 bg-red-100 text-red-700 rounded-[var(--radius)] text-sm">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || jobText.length < 50 || jobText.length > 8000}
          className="bg-[var(--primary)] text-white p-3 rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Job'}
        </button>
      </form>

      {analysis && (
        <div className="flex flex-col gap-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  {analysis.skill_match.matched.length > 0 ? analysis.skill_match.matched.map((skill, i) => (
                    <li key={i}>{skill}</li>
                  )) : <li className="text-gray-400 italic">None</li>}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Gaps</h3>
                <ul className="list-disc pl-5 text-red-600">
                  {analysis.skill_match.gaps.length > 0 ? analysis.skill_match.gaps.map((skill, i) => (
                    <li key={i}>{skill}</li>
                  )) : <li className="text-gray-400 italic">None</li>}
                </ul>
              </div>
            </div>

            <div className="bg-[var(--background)] p-6 rounded-[var(--radius)] border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Red Flags
              </h2>
              {analysis.red_flags.length > 0 ? (
                <ul className="list-disc pl-5 text-red-600 space-y-1">
                  {analysis.red_flags.map((flag, i) => <li key={i}>{flag}</li>)}
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
                  <button 
                    onClick={() => copyToClipboard(q, i)}
                    className="text-blue-500 hover:text-blue-700 p-1"
                    title="Copy question"
                    aria-label={`Copy question: ${q}`}
                  >
                    {copiedQuestion === i ? <Check size={18} /> : <Copy size={18} />}
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
            
            <button
              onClick={() => {
                if (proposalId) router.push(`/proposals/${proposalId}`)
              }}
              disabled={!proposalId}
              className={`font-bold py-3 px-6 rounded-[var(--radius)] whitespace-nowrap ${proposalId ? 'bg-[var(--primary)] text-white hover:opacity-90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Generate Proposal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
