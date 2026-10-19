/**
 * Login page: Sign up link must remain distinguishable without color
 * (always underlined).
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '@/app/login/page'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/app/auth/actions', () => ({
  login: vi.fn(),
}))

describe('Login page – Sign up link', () => {
  it('always underlines the Sign up link', () => {
    render(<LoginPage />)
    const link = screen.getByRole('link', { name: /sign up/i })
    expect(link.className).toMatch(/\bunderline\b/)
    expect(link.className).toMatch(/underline-offset-2/)
  })
})
