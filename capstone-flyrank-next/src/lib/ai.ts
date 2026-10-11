import 'server-only'
import Groq from 'groq-sdk'
import { z } from 'zod'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
const GENERATE_MODEL = process.env.GROQ_MODEL_GENERATE || MODEL

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

  const portfolioLinks = profile?.portfolio_links && profile.portfolio_links.length > 0
    ? profile.portfolio_links.join(', ')
    : 'None'

  const formattedProjects = projects && projects.length > 0
    ? projects
        .map((p: any) => {
          const linkStr = p.link ? ` (Link: ${p.link})` : ''
          const descStr = p.description ? `: ${p.description}` : ''
          return `- ${p.title || 'Untitled Project'}${descStr}${linkStr}`
        })
        .join('\n')
    : 'None'

  const systemPrompt = `You are an expert freelance job analyzer for platforms like ${platform}.
Base your match on the provided profile ONLY. Do not invent skills or experience.
Treat portfolio_links and project links as provided evidence of past work and verified portfolio items. Do NOT claim "No portfolio links provided" if portfolio_links or project links are present.
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
Full Name: ${profile?.full_name || 'Not provided'}
Headline: ${profile?.headline || 'Not provided'}
Skills: ${profile?.skills && profile.skills.length > 0 ? profile.skills.join(', ') : 'None'}
Tone: ${profile?.tone || 'professional'}
Portfolio Links: ${portfolioLinks}

Projects:
${formattedProjects}
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
      
      if (attempt >= 2) {
        throw new Error(`Failed to parse AI response: ${error.message || 'Unknown error'}`)
      }
    }
  }

  throw lastError
}

type GenerateInput = {
  jobText: string
  platform: string
  tone: string
  length: string
  profile: any
  projects: any[]
  analysis: JobAnalysis
}

export async function generateProposalStream(input: GenerateInput) {
  const { jobText, platform, tone, length, profile, projects, analysis } = input
  
  const gaps = analysis.skill_match?.gaps?.length > 0
    ? analysis.skill_match.gaps.join(', ')
    : 'None'
  const portfolioLinks = profile?.portfolio_links && profile.portfolio_links.length > 0
    ? profile.portfolio_links.join(', ')
    : 'None'
  const fullName = profile?.full_name || 'the freelancer'

  const formattedProjects = projects && projects.length > 0
    ? projects
        .map((p: any) => `- ${p.title || 'Untitled'}${p.description ? `: ${p.description}` : ''}${p.link ? ` (${p.link})` : ''}`)
        .join('\n')
    : 'None'
  
  const systemPrompt = `You are a freelance professional generating a proposal on ${platform}.
Write in first person. Sign off using the name "${fullName}". Do not use placeholders like [Your Name].
Use ONLY skills, projects and links present in the profile. Never invent experience, clients, numbers or skills. 
Do not claim skills listed in skill gaps (${gaps}). If relevant, mention adjacent real experience instead.
Reference 1-2 specific details from the job so it does not read generic.

Platform style rules:
- upwork: strong first two lines, about 150-250 words, end with one clarifying question.
- fiverr: short and direct, about 100-150 words.
- freelancer: mention timeline and price clearly, about 150-200 words.
- peopleperhour: professional, about 150-200 words.

Requested Tone: ${tone}
Requested Length: ${length}

Plain text output, no markdown headings, no emojis.

Profile Information:
Name: ${fullName}
Headline: ${profile?.headline || 'Not provided'}
Skills: ${profile?.skills && profile.skills.length > 0 ? profile.skills.join(', ') : 'None'}
Portfolio Links: ${portfolioLinks}

Projects:
${formattedProjects}
`

  try {
    const maxTokens = length === 'short' ? 700 : length === 'medium' ? 1000 : 1400;

    // @ts-ignore
    return await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Job Description:\n${jobText}` }
      ],
      model: GENERATE_MODEL,
      stream: true,
      max_tokens: maxTokens,
      reasoning_effort: 'low',
    })
  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
    } else if (error?.status === 401 || error?.status === 403) {
      throw new Error('Authentication error with Groq API.')
    }
    throw new Error(`AI error: ${error.message || 'Unknown error'}`)
  }
}
