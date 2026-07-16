import Link from "next/link";
import { ShieldCheck, Lock, TrendingDown, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="bg-slate-950 text-white text-xs py-2 px-4 flex justify-center items-center gap-6 font-mono">
        <span className="flex items-center gap-1.5"><Lock size={12} className="text-emerald-400"/> Servers: Johannesburg, South Africa</span>
        <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400"/> POPIA Compliant · Operator Agreement Available</span>
        <span className="flex items-center gap-1.5">AES-256 · No Data Retention</span>
      </div>

      <header className="bg-slate-950 text-white px-8 py-4 flex justify-between items-center shadow-md border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 font-bold px-2.5 py-1 rounded text-slate-950 text-sm">CL</div>
          <h1 className="text-xl font-bold tracking-tight">ChronoLegal <span className="text-amber-400">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/tool" className="text-xs text-slate-400 hover:text-white transition-colors">Try Demo</Link>
          <Link href="/pricing" className="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors">Pricing</Link>
          <Link href="/auth/login" className="text-xs text-slate-400 hover:text-white transition-colors">Sign In</Link>
          <Link href="/auth/register" className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg hover:bg-amber-400 transition-all">Sign Up</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-24">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-8">
            South Africa · RAF & Personal Injury
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-950 leading-[1.08] mb-6 tracking-tight">
            Your client's RAF claim<br/>
            <span className="text-amber-500">lives or dies on contradictions</span><br/>
            you haven't found yet.
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            ChronoLegal SA reads every hospital record, every expert report, every discharge summary — and flags the contradictions the RAF's own medico-legal team will exploit. Built for South African plaintiff attorneys. Grounded in our courts.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/tool" className="inline-flex items-center gap-2 bg-slate-950 text-white font-bold px-10 py-4 rounded-xl text-base hover:bg-slate-900 transition-all shadow-lg">
              Start Your First Chronology →
            </Link>
            <Link href="/tool" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-bold px-10 py-4 rounded-xl text-base hover:bg-slate-100 transition-all">
              Try Demo Case
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-20">
          {[
            { icon: <TrendingDown size={16} className="text-amber-600"/>, title: "RAF Contradictions", desc: "GCS scores, LOC claims, treatment gaps — the patterns the RAF exploits to reduce quantum." },
            { icon: <Clock size={16} className="text-amber-600"/>, title: "12 Hours → 20 Minutes", desc: "Reduce chronology prep from a full workday to under 20 minutes. Every matter, every time." },
            { icon: <ShieldCheck size={16} className="text-amber-600"/>, title: "SA Courts Grounded", desc: "Trained on SA medico-legal precedent. From Dlamini v RAF to the latest quantum rulings." },
            { icon: <Lock size={16} className="text-amber-600"/>, title: "POPIA by Design", desc: "Medical records processed on SA-hosted infrastructure. Encrypted. Deleted within 24 hours." },
          ].map(c => (
            <div key={c.title} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-300 transition-all">
              <div className="mb-2">{c.icon}</div>
              <div className="text-sm font-bold text-slate-900 mb-1">{c.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>

        <div className="text-center mb-16">
          <div className="text-xs font-mono font-bold text-amber-600 uppercase tracking-[0.2em] mb-4">How It Works</div>
          <h2 className="text-3xl font-extrabold text-slate-950 mb-4">Three steps to your chronology</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { step: "1", title: "Upload Your Bundle", desc: "Drag in anything — Discovery Health records, Netcare discharge summaries, orthopaedic surgeon reports, RAF1 forms. We read them all.", extra: "PDFs, scans, Word docs — even that sideways-scanned 200-pager your candidate attorney did." },
            { step: "2", title: "ChronoLegal Analyses", desc: "Our AI cross-references every date, every diagnosis, every finding. It knows what a normal recovery trajectory looks like — and what doesn't add up.", extra: "Typically completes in under 2 minutes for a 500-page bundle." },
            { step: "3", title: "Receive Your Matrix", desc: "Export to PDF for your brief to counsel. Ready for the joint expert minute. Ready for the settlement negotiation. Every contradiction cited to source.", extra: "Download, review, file. Your chronology is court-ready." },
          ].map(s => (
            <div key={s.step} className="bg-white border border-slate-200 rounded-2xl p-8 relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-amber-500 text-slate-950 font-extrabold text-lg rounded-xl flex items-center justify-center shadow-lg">{s.step}</div>
              <h3 className="font-bold text-slate-900 text-lg mt-2 mb-3">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{s.desc}</p>
              <p className="text-xs text-slate-400 italic">{s.extra}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-20 shadow-sm">
          <div className="text-amber-500 text-4xl font-serif mb-4">"</div>
          <p className="text-slate-700 leading-relaxed mb-4 italic">
            I had a loss-of-support claim where the orthopaedic surgeon's report placed the deceased's pre-accident mobility at 'unrestricted,' but the hospital admission notes from the same date recorded 'chronic back pain — struggles to walk unaided.' ChronoLegal flagged it in under 3 minutes. That contradiction would have destroyed my client's R2.4 million quantum at trial.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-800">TN</div>
            <div>
              <div className="font-bold text-slate-900 text-sm">T. Naidoo</div>
              <div className="text-xs text-slate-500">Director, Plaintiff Personal Injury Practice, Durban</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-950 mb-4">Your next RAF1 is probably on your desk right now.</h2>
          <p className="text-slate-600 mb-8">First chronology free. From your second matter onward, less than the cost of 30 minutes of your billable time.</p>
          <Link href="/tool" className="inline-flex items-center gap-2 bg-slate-950 text-white font-bold px-12 py-5 rounded-xl text-lg hover:bg-slate-900 transition-all shadow-xl">
            Start Your Free Chronology →
          </Link>
        </div>
      </main>
    </div>
  );
}