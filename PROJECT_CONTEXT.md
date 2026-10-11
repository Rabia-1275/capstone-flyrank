# ProposalAI
AI-powered freelance proposal generator. User sets a profile once, pastes a job
description, and gets job analysis, a personalized proposal, a score, clarifying
questions and a pricing/timeline suggestion.

## Stack
Next.js (App Router) + Tailwind, Supabase (auth + Postgres), Groq API (free tier),
Vercel deploy. App lives in capstone-flyrank-next/.

## Rules
- AI API keys only in server-side route handlers, never in client code
- Supabase service role key never used in the frontend
- All tables protected by Row Level Security (user sees only own rows)
- All AI calls go through one file: lib/ai.ts (provider swappable)
- AI calls kept minimal: Analyze (1 call, JSON), Generate (streaming), Score (on demand)
- Small commits, Conventional Commits format
- Never commit .env files

## Phases
1 Auth + DB | 2 Profile | 3 Analyze | 4 Generate + editor | 5 History + status
6 Score | 7 Dashboard | 8 Polish + deploy