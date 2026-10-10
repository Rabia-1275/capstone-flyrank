import 'server-only'
import Groq from 'groq-sdk'
import { z } from 'zod'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192'

export const analysisSchema = z.object({
  summary: z.string(),
  client_needs: z.array(z.string()),
  required_skills: z.array(z.string()),
  skill_match: z.object({
    matched: z.array(z.string()),
    gaps: z.array(z.string()),
  }),
  red_flags: z.array(z.string()),
  clarifying_questions: z.array(z.string()).length(3),
  pricing: z.object({
    model: z.enum(['fixed', 'hourly']),
    low: z.number(),
    high: z.number(),
    currency: z.literal('USD'),
    timeline_days: z.number(),
    reasoning: z.string()
  })
})

export type JobAnalysis = z.infer<typeof analysisSchema>

type AnalyzeInput = {
  jobText: string
  platform: string
  profile: any
  projects: any[]
}

export async function analyzeJob(input: AnalyzeInput): Promise<JobAnalysis> {
  const { jobText, platform, profile, projects } = input
  
  const systemPrompt = `You are an expert freelance job analyzer for platforms like ${platform}.
Base your match on the provided profile ONLY. Do not invent skills or experience.
Treat pricing as a rough estimate.
Always return your response in JSON format exactly matching the following schema.
Ensure your response is parseable JSON.

Schema:
{
  "summary": "String",
  "client_needs": ["String"],
  "required_skills": ["String"],
  "skill_match": {
    "matched": ["String"],
    "gaps": ["String"]
  },
  "red_flags": ["String"],
  "clarifying_questions": ["String", "String", "String"],
  "pricing": {
    "model": "fixed" or "hourly",
    "low": Number,
    "high": Number,
    "currency": "USD",
    "timeline_days": Number,
    "reasoning": "String"
  }
}

Profile Information:
Name: ${profile?.full_name}
Headline: ${profile?.headline}
Skills: ${profile?.skills?.join(', ')}
Tone: ${profile?.tone}

Projects:
${projects?.map(p => `- ${p.title}: ${p.description}`).join('\n')}
`

  let attempt = 0
  let lastError: Error | null = null

  while (attempt < 2) {
    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Job Description:\n${jobText}` }
        ],
        model: MODEL,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from Groq')

      const parsed = JSON.parse(content)
      return analysisSchema.parse(parsed)
    } catch (error: any) {
      attempt++
      lastError = error
      
      if (error?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
      } else if (error?.status === 401 || error?.status === 403) {
        throw new Error('Authentication error with Groq API.')
      }
      
      // If we failed validation or parsing, we retry once
      if (attempt >= 2) {
        throw new Error(`Failed to parse AI response: ${error.message || 'Unknown error'}`)
      }
    }
  }

  throw lastError
}
