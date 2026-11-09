import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ChatTab } from '../src/pages/DocumentDetails.jsx'
import client from '../src/api/client.js'

vi.mock('../src/api/client.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

describe('chat component', () => {
  it('shows loading and then chat history', async () => {
    let resolveRequest
    client.get.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve }))
    render(<ChatTab documentId="doc-1" />)
    expect(screen.getByText('Loading chat history')).toBeInTheDocument()
    resolveRequest({ data: { data: [{ role: 'assistant', content: 'The court dismissed the claim.', sources: [] }] } })
    expect(await screen.findByText('The court dismissed the claim.')).toBeInTheDocument()
  })

  it('shows history loading errors', async () => {
    client.get.mockRejectedValueOnce({ response: { data: { message: 'Unable to load chat history.' } } })
    render(<ChatTab documentId="doc-1" />)
    expect(await screen.findByText('Unable to load chat history.')).toBeInTheDocument()
    await waitFor(() => expect(client.get).toHaveBeenCalledWith('/documents/doc-1/chat'))
  })
})
