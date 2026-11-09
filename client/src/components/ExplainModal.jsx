import { useEffect, useState } from 'react'
import Alert from './Alert'
import Spinner from './Spinner'
import client from '../api/client'

function ExplainModal({ request, onClose }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadExplanation() {
      try {
        const response = await client.post('/explain', request)
        if (active) setResult(response.data.data)
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Unable to explain this content.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadExplanation()
    return () => { active = false }
  }, [request])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true">
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Explain with AI</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Plain-language explanation</h2>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close explanation">×</button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Based only on the supplied content. This is not legal advice.</p>
        {request.selectedText ? <blockquote className="mt-5 border-l-4 border-teal-200 bg-slate-50 p-3 text-sm italic text-slate-600">{request.selectedText}</blockquote> : null}
        <div className="mt-6">
          {isLoading ? <Spinner label="Preparing explanation" /> : null}
          {error ? <Alert>{error}</Alert> : null}
          {result ? <ExplanationResult result={result} /> : null}
        </div>
      </aside>
    </div>
  )
}

function ExplanationResult({ result }) {
  return (
    <div className="space-y-5">
      <ExplanationSection title="What happened" value={result.whatHappened} />
      <ExplanationSection title="Why it matters" value={result.whyItMatters} />
      <ExplanationSection title="Simple explanation" value={result.simpleExplanation} />
      <ExplanationSection title="Affected parties" value={result.affectedParties} list />
      <ExplanationSection title="Relevant laws" value={result.relevantLaws} list />
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Glossary</h3>
        <div className="mt-3 space-y-3">
          {result.glossary?.length ? result.glossary.map((item) => (
            <div key={item.term} className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">{item.term}</p>
              <p className="mt-1 leading-6 text-slate-600">{item.meaning}</p>
            </div>
          )) : <p className="text-sm text-slate-400">Not stated in the document</p>}
        </div>
      </section>
    </div>
  )
}

function ExplanationSection({ title, value, list = false }) {
  return (
    <section>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      {list ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {(value?.length ? value : ['Not stated in the document']).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      ) : <p className="mt-3 text-sm leading-7 text-slate-700">{value || 'Not stated in the document'}</p>}
    </section>
  )
}

export default ExplainModal
