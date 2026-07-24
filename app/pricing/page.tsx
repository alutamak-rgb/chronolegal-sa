"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle, Zap, ShieldCheck, ArrowRight, CreditCard } from "lucide-react";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const m = annual ? 0.83 : 1;

  const tiers = [
    {
      name: "Pay-As-You-Go", price: "1,950", unit: "/case", desc: "For occasional RAF matters.", cases: 1, cta: "Start Free Trial", popular: false,
      features: ["1 case analysis", "Full contradiction matrix", "Source citations", "PDF/A-3 export", "POPIA-compliant storage", "Email support (48hr)"],
    },
    {
      name: "Professional", price: annual ? "6,225" : "7,500", unit: "/month", desc: "For active plaintiff practices.", cases: 5, cta: "Start 14-Day Trial", popular: true,
      features: ["5 cases/month", "Everything in PAYG", "CaseLines .docx export", "OCR on uploaded PDFs", "Dashboard with history", "Priority support (4hr)", "Rollover: 2 unused cases"],
    },
    {
      name: "Practice", price: annual ? "10,375" : "12,500", unit: "/month", desc: "For busy RAF litigation teams.", cases: 10, cta: "Start 14-Day Trial", popular: false,
      features: ["10 cases/month", "Everything in Professional", "Multi-user access (3 seats)", "Expedited analysis (<4hr)", "Dedicated account manager", "Rollover: 5 unused cases", "API access"],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-950 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <Link href="/" className="flex items-center gap-3 no-underline"><div className="bg-amber-500 font-bold px-2.5 py-1 rounded text-slate-950 text-sm">CL</div><h1 className="text-xl font-bold tracking-tight">ChronoLegal <span className="text-amber-400">AI</span></h1></Link>
        <div className="flex items-center gap-4"><Link href="/tool" className="text-xs text-slate-400 hover:text-white">Tool</Link><Link href="/pricing" className="text-xs text-amber-400 font-bold">Pricing</Link></div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-6">ZAR Pricing · No Forex Risk</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 mb-4">Recoverable from your<br/><span className="text-amber-500">RAF settlement.</span></h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">ChronoLegal SA is a disbursement you can recover. At R1,950 per case, it's less than the cost of 45 minutes of your billable time — and it catches contradictions that protect your client's quantum.</p>
          <div className="flex justify-center items-center gap-4 mt-8"><span className={`text-sm font-bold ${!annual?'text-slate-900':'text-slate-400'}`}>Monthly</span><button onClick={()=>setAnnual(!annual)} className="w-12 h-6 bg-slate-200 rounded-full relative"><div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-amber-500 rounded-full transition-transform ${annual?'translate-x-6':''}`}></div></button><span className={`text-sm font-bold ${annual?'text-slate-900':'text-slate-400'}`}>Annual <span className="text-emerald-600 text-xs ml-1">Save 17%</span></span></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {tiers.map(t => (
            <div key={t.name} className={`bg-white border-2 rounded-2xl p-8 flex flex-col relative ${t.popular?'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.15)] md:-translate-y-2':'border-slate-200'}`}>
              {t.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Most Popular</div>}
              <h3 className="text-lg font-bold text-slate-800 mb-1">{t.name}</h3>
              <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-extrabold text-slate-950">R{t.price}</span><span className="text-slate-400 text-sm">{t.unit}</span></div>
              <p className="text-xs text-slate-500 mb-6">{t.desc}</p>
              <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs font-bold text-amber-800 mb-6">{t.cases} case{t.cases>1?'s':''}/month · {(Math.round(parseInt(t.price.replace(',',''))/t.cases)).toLocaleString()}/case</div>
              <ul className="space-y-3 mb-8 flex-1">
                {t.features.map(f => (<li key={f} className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5"/>{f}</li>))}
              </ul>
              <Link href="/auth/register" className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${t.popular?'bg-amber-500 text-slate-950 hover:bg-amber-400':'bg-slate-950 text-white hover:bg-slate-900'}`}>{t.cta}</Link>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-20">
          <div className="text-center mb-8"><h2 className="text-2xl font-extrabold text-slate-950">Why R1,950 per case?</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Zap size={20} className="text-amber-500"/>, title: "12-27 hours saved", desc: "Manual chronology takes a full workday or more. ChronoLegal does it in under 3 minutes. At R1,950, that's R72–R162 per hour saved — vs R1,500–R2,500 you bill." },
              { icon: <ShieldCheck size={20} className="text-amber-500"/>, title: "Recoverable disbursement", desc: "Treat ChronoLegal as a disbursement on your RAF bill of costs. The Taxing Master won't blink at R1,950 in a R50K–R250K medico-legal budget." },
              { icon: <CreditCard size={20} className="text-amber-500"/>, title: "Contingency-friendly", desc: "You only pay when you use it. No monthly commitment on PAYG. Matches your no-win-no-fee cash flow." },
            ].map(b => (
              <div key={b.title} className="text-center"><div className="mb-3 flex justify-center">{b.icon}</div><h3 className="font-bold text-slate-900 text-sm mb-2">{b.title}</h3><p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p></div>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 text-white rounded-2xl p-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-6">Launch Offer · 90 Days</div>
          <h2 className="text-3xl font-extrabold mb-4">Founding Member Pricing</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">First 50 firms lock in R1,450/case or R5,950/month Professional. Price guaranteed for 24 months. No lock-in. Cancel anytime.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-bold px-10 py-4 rounded-xl text-lg hover:bg-amber-400 transition-all">Start Your Free Trial <ArrowRight size={20}/></Link>
        </div>
      </main>
    </div>
  );
}
