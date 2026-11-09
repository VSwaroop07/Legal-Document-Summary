import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ExplainModal from '../components/ExplainModal'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'

const NOT_STATED = 'Not stated in the document'
const starterQuestions = ['Who are the parties?', 'What was the final decision?', 'What laws were cited?']

function isNotStated(value) {
  return value === NOT_STATED || !value
}

function DetailCard({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-slate-700">{children}</div>
    </section>
  )
}

function SummaryValue({ value }) {
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc space-y-2 pl-5">
        {value.map((item, index) => (
          <li key={`${item}-${index}`} className={isNotStated(item) ? 'text-slate-400' : ''}>{item}</li>
        ))}
      </ul>
    )
  }

  return <p className={isNotStated(value) ? 'text-slate-400' : ''}>{value || NOT_STATED}</p>
}

function SummaryTab({ document, onSummaryUpdated, onExplain }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const summary = document.summary && Object.keys(document.summary).length ? document.summary : null

  async function generateSummary(force = false) {
    setIsGenerating(true)
    setError('')
    try {
      const response = await client.post(`/documents/${document._id}/summarize${force ? '?force=true' : ''}`)
      onSummaryUpdated(response.data.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate the summary.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function copySummary() {
    await navigator.clipboard.writeText(JSON.stringify(summary, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <h2 className="text-xl font-bold text-slate-900">No summary yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Generate a structured summary from the document&apos;s extracted text.</p>
        {error ? <div className="mx-auto mt-5 max-w-lg text-left"><Alert>{error}</Alert></div> : null}
        <Button className="mt-6" onClick={() => generateSummary()} loading={isGenerating}>Generate summary</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-3">
        {error ? <div className="w-full"><Alert>{error}</Alert></div> : null}
        <Button variant="secondary" onClick={copySummary}>{copied ? 'Copied' : 'Copy summary'}</Button>
        <Button onClick={() => generateSummary(true)} loading={isGenerating}>Regenerate</Button>
      </div>
      <div
        className="relative mt-5 grid gap-4 lg:grid-cols-2"
        onMouseUp={(event) => {
          const selection = window.getSelection()
          const selectedText = selection?.toString().trim()
          if (selectedText && event.currentTarget.contains(selection.anchorNode)) {
            const rect = selection.getRangeAt(0).getBoundingClientRect()
            onExplain(selectedText, { top: rect.bottom + 8, left: rect.left })
          }
        }}
      >
        <DetailCard title="Case background"><SummaryValue value={summary.caseBackground} /></DetailCard>
        <DetailCard title="Legal issues"><SummaryValue value={summary.legalIssues} /></DetailCard>
        <DetailCard title="Arguments">
          <div className="space-y-4">
            <div><p className="font-semibold text-slate-900">Petitioner</p><SummaryValue value={summary.arguments?.petitioner} /></div>
            <div><p className="font-semibold text-slate-900">Respondent</p><SummaryValue value={summary.arguments?.respondent} /></div>
          </div>
        </DetailCard>
        <DetailCard title="Court reasoning"><SummaryValue value={summary.courtReasoning} /></DetailCard>
        <DetailCard title="Judgment"><SummaryValue value={summary.judgment} /></DetailCard>
        <DetailCard title="Key takeaways"><SummaryValue value={summary.keyTakeaways} /></DetailCard>
        <DetailCard title="Document type"><SummaryValue value={summary.documentType} /></DetailCard>
      </div>
    </div>
  )
}

function CitationText({ text, onCitationClick }) {
  const parts = text.split(/(\[\d+\])/g)
  return parts.map((part, index) => {
    const match = part.match(/^\[(\d+)\]$/)
    if (!match) return <span key={index}>{part}</span>
    return (
      <button key={index} type="button" className="font-bold text-teal-700 underline decoration-teal-300 underline-offset-2" onClick={() => onCitationClick(Number(match[1]))}>
        {part}
      </button>
    )
  })
}

function Sources({ sources, highlightedSource, onHighlight }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (highlightedSource && sources.some((source, index) => (source.citation || index + 1) === highlightedSource)) {
      setOpen(true)
    }
  }, [highlightedSource, sources])

  if (!sources?.length) return null

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <button type="button" className="text-xs font-semibold text-slate-600 hover:text-slate-900" onClick={() => setOpen(!open)}>
        {open ? 'Hide sources' : `Sources (${sources.length})`}
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          {sources.map((source, index) => {
            const citation = source.citation || index + 1
            return (
            <button
              type="button"
              key={`${source.chunkIndex}-${source.pageNumber}-${citation}`}
              className={`block w-full rounded-lg border p-3 text-left text-xs leading-5 transition ${highlightedSource === citation ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
              onClick={() => onHighlight(citation)}
            >
              <span className="font-semibold text-slate-700">[{citation}] Page {source.pageNumber} · Chunk {source.chunkIndex}</span>
              <span className="mt-1 block text-slate-600">{source.snippet}</span>
            </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function ChatTab({ documentId }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [highlightedCitation, setHighlightedCitation] = useState(null)

  const loadHistory = useCallback(async () => {
    setError('')
    try {
      const response = await client.get(`/documents/${documentId}/chat`)
      setMessages(response.data.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load chat history.')
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  async function sendQuestion(event) {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || trimmedQuestion.length > 500) return
    setIsSending(true)
    setError('')
    setQuestion('')
    try {
      const response = await client.post(`/documents/${documentId}/chat`, { question: trimmedQuestion })
      setMessages((current) => [
        ...current,
        { role: 'user', content: trimmedQuestion, sources: [] },
        { role: 'assistant', ...response.data.data },
      ])
    } catch (requestError) {
      setQuestion(trimmedQuestion)
      setError(requestError.response?.data?.message || 'Unable to answer that question.')
    } finally {
      setIsSending(false)
    }
  }

  async function clearHistory() {
    try {
      await client.delete(`/documents/${documentId}/chat`)
      setMessages([])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to clear chat history.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ask questions</h2>
          <p className="mt-1 text-sm text-slate-500">Answers use only retrieved excerpts from this document.</p>
        </div>
        <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={clearHistory} disabled={!messages.length}>Clear chat</Button>
      </div>
      {error ? <div className="mt-5"><Alert>{error}</Alert></div> : null}
      {isLoading ? <div className="mt-10"><Spinner label="Loading chat history" /></div> : null}
      {!isLoading && !messages.length ? (
        <div className="mt-8">
          <EmptyState title="Start with a question" description="Ask about the parties, decision, reasoning, or cited laws.">
            <div className="flex flex-wrap justify-center gap-2">
              {starterQuestions.map((starter) => <Button key={starter} variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setQuestion(starter)}>{starter}</Button>)}
            </div>
          </EmptyState>
        </div>
      ) : null}
      <div className="mt-6 space-y-4">
        {messages.map((message, index) => (
          <div key={`${message.createdAt || index}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === 'user' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
              <p className="whitespace-pre-wrap">
                {message.role === 'assistant'
                  ? <CitationText text={message.content} onCitationClick={setHighlightedCitation} />
                  : message.content}
              </p>
              {message.role === 'assistant' ? <Sources sources={message.sources} highlightedSource={highlightedCitation} onHighlight={setHighlightedCitation} /> : null}
            </div>
          </div>
        ))}
        {isSending ? (
          <div className="flex justify-start"><div className="rounded-2xl border border-slate-200 bg-white px-4 py-3"><Spinner label="Thinking from the document" /></div></div>
        ) : null}
      </div>
      <form onSubmit={sendQuestion} className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            placeholder="Ask a question about this document..."
            className="min-h-12 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            aria-label="Ask a question"
          />
          <Button type="submit" loading={isSending} disabled={!question.trim()}>Ask question</Button>
        </div>
        <p className="mt-2 text-right text-xs text-slate-400">{question.length}/500</p>
      </form>
    </div>
  )
}

function DocumentDetails() {
  const { id } = useParams()
  const [document, setDocument] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [explanationRequest, setExplanationRequest] = useState(null)
  const [selectionPosition, setSelectionPosition] = useState(null)

  useEffect(() => {
    async function loadDocument() {
      try {
        const response = await client.get(`/documents/${id}`)
        setDocument(response.data.data)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load this document.')
      } finally {
        setIsLoading(false)
      }
    }
    loadDocument()
  }, [id])

  if (isLoading) return <Spinner label="Loading document" />
  if (error) return <Alert>{error}</Alert>
  if (!document) return <EmptyState title="Document not found" description="This document may have been deleted or is not available to your account." />

  return (
    <div>
      <Link to="/dashboard" className="text-sm font-medium text-teal-700 hover:text-teal-800">← Back to dashboard</Link>
      <div className="mt-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3"><StatusBadge status={document.status} /><span className="text-xs text-slate-500">{document.pageCount || 0} pages</span></div>
          <h1 className="mt-3 truncate text-3xl font-bold tracking-tight text-slate-900">{document.title}</h1>
          <p className="mt-2 text-sm text-slate-500">Uploaded {new Date(document.createdAt).toLocaleDateString()}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setExplanationRequest({ type: 'document', id })}
        >
          Explain with AI
        </Button>
      </div>
      <div className="mt-6 flex gap-6 border-b border-slate-200">
        {['summary', 'chat'].map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`border-b-2 pb-3 text-sm font-semibold capitalize ${activeTab === tab ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            {tab === 'chat' ? 'Ask questions' : 'Summary'}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {activeTab === 'summary' ? (
          <SummaryTab
            document={document}
            onSummaryUpdated={(summary) => setDocument({ ...document, summary })}
            onExplain={(selectedText, position) => {
              setExplanationRequest({ type: 'document', id, selectedText })
              setSelectionPosition(position)
            }}
          />
        ) : <ChatTab documentId={id} />}
      </div>
      {selectionPosition && explanationRequest ? (
        <button
          type="button"
          className="fixed z-40 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg"
          style={{ top: selectionPosition.top, left: selectionPosition.left }}
          onClick={() => setSelectionPosition(null)}
        >
          Explain
        </button>
      ) : null}
      {explanationRequest && !selectionPosition ? <ExplainModal request={explanationRequest} onClose={() => setExplanationRequest(null)} /> : null}
      <p className="mt-10 text-center text-xs text-slate-400">AI-generated output is for understanding only and is not legal advice.</p>
    </div>
  )
}

export default DocumentDetails
