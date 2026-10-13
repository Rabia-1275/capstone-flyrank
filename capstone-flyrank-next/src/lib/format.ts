/**
 * Shared display name formatting helpers for platforms and tones.
 */

export function formatPlatformName(platform: string | null | undefined): string {
  if (!platform) return 'Unknown'
  const key = platform.trim().toLowerCase()
  switch (key) {
    case 'upwork':
      return 'Upwork'
    case 'fiverr':
      return 'Fiverr'
    case 'freelancer':
      return 'Freelancer'
    case 'peopleperhour':
      return 'PeoplePerHour'
    case 'custom':
      return 'Custom'
    default:
      return key.charAt(0).toUpperCase() + key.slice(1)
  }
}

export function formatToneName(tone: string | null | undefined): string {
  if (!tone) return 'Professional'
  const key = tone.trim().toLowerCase()
  switch (key) {
    case 'professional':
      return 'Professional'
    case 'friendly':
      return 'Friendly'
    case 'confident':
      return 'Confident'
    case 'concise':
      return 'Concise'
    default:
      return key.charAt(0).toUpperCase() + key.slice(1)
  }
}
