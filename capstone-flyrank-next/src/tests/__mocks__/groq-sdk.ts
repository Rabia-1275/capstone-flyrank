// Stub for groq-sdk in tests. Prevents any real API calls.
import { vi } from 'vitest'

const groqMock = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{}' } }],
      }),
    },
  },
}

export default class Groq {
  chat = groqMock.chat
}
