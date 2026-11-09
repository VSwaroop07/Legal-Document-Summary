import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'

function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const inputRef = useRef(null)

  const loadDocuments = useCallback(async () => {
    setError('')
    try {
      const response = await client.get('/documents')
      setDocuments(response.data.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your documents.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return documents
    return documents.filter((document) => document.title.toLowerCase().includes(term))
  }, [documents, search])

  function validateFile(file) {
    if (!file) return 'Choose a PDF file to upload.'
    if (file.type !== 'application/pdf') return 'Only PDF files are supported.'
    if (file.size > 15 * 1024 * 1024) return 'PDF files must be 15 MB or smaller.'
    return ''
  }

  async function uploadFile(file) {
    const validationError = validateFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }

    setUploadError('')
    setIsUploading(true)
    setUploadProgress(0)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await client.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total))
        },
      })
      setDocuments((current) => [response.data.data, ...current])
    } catch (requestError) {
      setUploadError(requestError.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)
    uploadFile(event.dataTransfer.files[0])
  }

  async function deleteDocument() {
    setIsDeleting(true)
    try {
      await client.delete(`/documents/${documentToDelete._id}`)
      setDocuments((current) => current.filter((document) => document._id !== documentToDelete._id))
      setDocumentToDelete(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this document.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Your documents</h1>
          <p className="mt-3 text-slate-500">Upload a legal PDF to extract, summarize, and question its content.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => uploadFile(event.target.files[0])}
        />
      </div>

      <div
        className={`mt-8 rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-10 ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-white'}`}
        onDragOver={(event) => { event.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="mx-auto max-w-lg">
          <p className="text-lg font-semibold text-slate-900">Upload a legal PDF</p>
          <p className="mt-2 text-sm text-slate-500">Drag and drop a PDF here, or choose one from your device. Maximum size: 15 MB.</p>
          <Button className="mt-5" onClick={() => inputRef.current?.click()} loading={isUploading}>Choose PDF</Button>
          {isUploading ? (
            <div className="mt-5">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-teal-600 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Uploading and processing: {uploadProgress}%</p>
            </div>
          ) : null}
          {uploadError ? <div className="mt-5 text-left"><Alert>{uploadError}</Alert></div> : null}
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold text-slate-900">Recent documents</h2>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title"
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          aria-label="Search documents by title"
        />
      </div>

      {error ? <div className="mt-5"><Alert>{error}</Alert></div> : null}
      {isLoading ? <div className="mt-10"><Spinner label="Loading documents" /></div> : null}
      {!isLoading && !filteredDocuments.length ? (
        <div className="mt-6">
          <EmptyState
            title={search ? 'No matching documents' : 'No documents yet'}
            description={search ? 'Try another title or clear the search.' : 'Your uploaded judgments, contracts, and notices will appear here.'}
          />
        </div>
      ) : null}
      {!isLoading && filteredDocuments.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredDocuments.map((document) => (
            <article key={document._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/documents/${document._id}`} className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900 hover:text-teal-700">{document.title}</h3>
                  <p className="mt-2 text-xs text-slate-500">
                    Uploaded {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <StatusBadge status={document.status} />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">{document.pageCount ? `${document.pageCount} pages` : 'Processing pages'}</span>
                <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setDocumentToDelete(document)}>Delete</Button>
              </div>
              {document.status === 'failed' && document.errorMessage ? <p className="mt-3 text-sm text-red-600">{document.errorMessage}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      {documentToDelete ? (
        <ConfirmDialog
          title="Delete this document?"
          description="This removes the document, its chunks, and its chat history. This action cannot be undone."
          confirmLabel="Delete document"
          loading={isDeleting}
          onConfirm={deleteDocument}
          onCancel={() => setDocumentToDelete(null)}
        />
      ) : null}
    </div>
  )
}

export default Dashboard
