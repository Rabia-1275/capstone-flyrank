/**
 * DashboardContent accessibility: small-sample notes must not use
 * text-amber-500 (2.13:1 on white).
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardContent from '@/components/DashboardContent'
import type { DashboardData } from '@/lib/dashboard'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const data: DashboardData = {
  total: 1,
  submitted: 1,
  replyRate: 0,
  winRate: 0,
  avgScore: null,
  scoredCount: 0,
  byPlatform: [
    {
      label: 'upwork',
      submitted: 1,
      replied: 0,
      won: 0,
      winRate: 0,
      avgScoreWon: null,
      avgScoreNotWon: null,
    },
  ],
  byTone: [
    {
      label: 'professional',
      submitted: 1,
      replied: 0,
      won: 0,
      winRate: 0,
      avgScoreWon: null,
      avgScoreNotWon: null,
    },
  ],
  weekly: [],
}

describe('DashboardContent – small sample contrast', () => {
  it('does not use text-amber-500 on the n<5 note', () => {
    render(<DashboardContent data={data} />)
    const notes = screen.getAllByText(/\(n=1\)/)
    expect(notes.length).toBeGreaterThan(0)
    for (const note of notes) {
      expect(note.className).not.toMatch(/text-amber-500/)
      expect(note.className).toMatch(/text-amber-700/)
    }
  })
})
