import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-slate-950 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 font-bold px-2.5 py-1 rounded text-slate-950 text-sm">CL</div>
          <h1 className="text-xl font-bold tracking-tight">ChronoLegal <span className="text-amber-400">AI</span></h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-8">
          South Africa · RAF & Personal Injury
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-950 leading-tight mb-6">
          Find contradictions<br/>
          <span className="text-amber-500">before opposing counsel does.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          ChronoLegal AI compares hospital records against expert medico-legal reports — flagging discrepancies in GCS scores, loss of consciousness, employability findings, and treatment gaps that can destroy your quantum claim at trial.
        </p>
        <Link href="/tool" className="inline-flex items-center gap-2 bg-slate-950 text-white font-bold px-10 py-4 rounded-xl text-lg hover:bg-slate-900 transition-all shadow-lg">
          Launch Analysis Tool →
        </Link>
        <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-slate-200 text-xs text-slate-400 font-mono">
          <span>DeepSeek-Powered</span><span>POPIA Compliant</span><span>No Data Retention</span>
        </div>
      </main>
    </div>
  );
}
