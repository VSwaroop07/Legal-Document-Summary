function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-10 shadow-2xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Legal technology platform
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Legal Summarizer
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          Understand legal documents and stay informed with structured,
          source-aware summaries.
        </p>
        <p className="mt-8 border-t border-slate-800 pt-6 text-sm text-slate-400">
          AI output is an aid to understanding, not legal advice.
        </p>
      </section>
    </main>
  )
}

export default App
