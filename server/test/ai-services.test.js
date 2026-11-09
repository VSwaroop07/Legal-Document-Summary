import { describe, expect, it, vi } from 'vitest'

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: class {
    withStructuredOutput() {
      return {
        invoke: vi.fn().mockResolvedValue({
          parsed: {
            whatHappened: 'A court considered a claim.',
            whyItMatters: 'The decision resolves the claim.',
            affectedParties: ['The parties'],
            relevantLaws: ['Civil Procedure Act'],
            simpleExplanation: 'The court decided the dispute.',
            glossary: [],
          },
          raw: { usage_metadata: { input_tokens: 1, output_tokens: 1 } },
        }),
      }
    }
  },
}))

const { explainText } = await import('../src/services/explainService.js')

describe('mocked OpenAI services', () => {
  it('returns validated explanations without calling a real provider', async () => {
    const result = await explainText({ type: 'document', text: 'The court considered a claim.' })
    expect(result.whatHappened).toBe('A court considered a claim.')
    expect(result.relevantLaws).toEqual(['Civil Procedure Act'])
  })
})
