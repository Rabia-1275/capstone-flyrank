/**
 * Tests for src/lib/format.ts – pure formatting functions.
 */
import { describe, it, expect } from 'vitest'
import { formatPlatformName, formatToneName } from '@/lib/format'

describe('formatPlatformName', () => {
  it('returns "Upwork" for "upwork"', () => {
    expect(formatPlatformName('upwork')).toBe('Upwork')
  })

  it('returns "Fiverr" for "fiverr"', () => {
    expect(formatPlatformName('fiverr')).toBe('Fiverr')
  })

  it('returns "Freelancer" for "freelancer"', () => {
    expect(formatPlatformName('freelancer')).toBe('Freelancer')
  })

  it('returns "PeoplePerHour" for "peopleperhour"', () => {
    expect(formatPlatformName('peopleperhour')).toBe('PeoplePerHour')
  })

  it('returns "Custom" for "custom"', () => {
    expect(formatPlatformName('custom')).toBe('Custom')
  })

  it('capitalizes unknown platform names', () => {
    expect(formatPlatformName('toptal')).toBe('Toptal')
  })

  it('returns "Unknown" for null', () => {
    expect(formatPlatformName(null)).toBe('Unknown')
  })

  it('returns "Unknown" for undefined', () => {
    expect(formatPlatformName(undefined)).toBe('Unknown')
  })

  it('is case-insensitive for known platforms', () => {
    expect(formatPlatformName('UPWORK')).toBe('Upwork')
    expect(formatPlatformName('FIVERR')).toBe('Fiverr')
  })
})

describe('formatToneName', () => {
  it('returns "Professional" for "professional"', () => {
    expect(formatToneName('professional')).toBe('Professional')
  })

  it('returns "Friendly" for "friendly"', () => {
    expect(formatToneName('friendly')).toBe('Friendly')
  })

  it('returns "Confident" for "confident"', () => {
    expect(formatToneName('confident')).toBe('Confident')
  })

  it('returns "Concise" for "concise"', () => {
    expect(formatToneName('concise')).toBe('Concise')
  })

  it('returns "Professional" for null', () => {
    expect(formatToneName(null)).toBe('Professional')
  })

  it('returns "Professional" for undefined', () => {
    expect(formatToneName(undefined)).toBe('Professional')
  })

  it('capitalizes unknown tone names', () => {
    expect(formatToneName('casual')).toBe('Casual')
  })
})
