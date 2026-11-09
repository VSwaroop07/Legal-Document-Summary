import EmptyState from '../components/EmptyState'

function Dashboard() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Workspace</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Your dashboard</h1>
      <p className="mt-3 text-slate-500">Upload a legal document to begin building an understanding of it.</p>
      <div className="mt-8"><EmptyState title="No documents yet" description="Your uploaded judgments, contracts, and notices will appear here." /></div>
    </div>
  )
}

export default Dashboard
