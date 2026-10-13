import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your ProposalAI account to start generating tailored proposals.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
