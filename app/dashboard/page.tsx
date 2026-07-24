"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Search, Plus, Calendar, User, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface CaseRecord {
  id: string; caseRef: string; claimant: string; attorney: string;
  accidentDate: string; status: string; createdAt: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    
    async function fetchCases() {
      try {
        const res = await fetch(`/api/cases?userId=${encodeURIComponent(user!.id)}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setCases(result.cases || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500"/></div>;
  }

  if (!user) return null;

  const filtered = cases.filter(c =>
    c.claimant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-950 text-white px-8 py-4 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="bg-amber-500 font-bold px-2.5 py-1 rounded text-slate-950 text-sm">CL</div>
          <h1 className="text-xl font-bold tracking-tight">ChronoLegal <span className="text-amber-400">AI</span></h1>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/tool" className="text-xs text-slate-400 hover:text-white">Analysis Tool</Link>
          <Link href="/dashboard" className="text-xs text-amber-400 font-bold">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Case Directory</h2>
            <p className="text-xs text-slate-400 mt-1">{user.firmName || user.name || user.email} · {cases.length} case{cases.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/tool" className="bg-amber-500 text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow hover:bg-amber-400 transition-all text-sm">
            <Plus className="h-4 w-4"/>Analyze New Case
          </Link>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4 mb-8 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5"/>
          <div>
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide font-mono">POPIA Compliant · Your Cases Only</h4>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              All case data is isolated to your account. No other firm can see your matters. Stored on encrypted infrastructure.
            </p>
          </div>
        </div>

        <div className="flex bg-white border rounded-xl p-3 shadow-sm mb-6 items-center gap-3">
          <Search className="text-slate-400 h-5 w-5 shrink-0"/>
          <input type="text" placeholder="Search by Claimant or Case Reference..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full text-sm bg-transparent border-0 focus:outline-none text-slate-800"/>
        </div>

        {error && (<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm"><AlertTriangle className="h-5 w-5 shrink-0"/><p>{error}</p></div>)}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3"><Loader2 className="h-8 w-8 animate-spin text-amber-500"/><p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Loading Case Registry...</p></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border rounded-2xl p-16 text-center shadow-sm">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4"/>
            <h3 className="text-base font-bold text-slate-700">No Case Files Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">{searchTerm ? "No cases match your search." : "No matters registered yet. Start your first analysis."}</p>
            <Link href="/tool" className="inline-flex items-center gap-2 bg-slate-950 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-900"><Plus className="h-3.5 w-3.5"/>Start First Analysis</Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-950 text-white font-mono uppercase text-xs tracking-wider">
                  <tr><th className="p-4 border-b">Case Reference</th><th className="p-4 border-b">Claimant</th><th className="p-4 border-b">Attorney</th><th className="p-4 border-b">Accident Date</th><th className="p-4 border-b">Status</th><th className="p-4 border-b text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => {
                    const ok = item.status === "COMPLETED";
                    const fail = item.status === "FAILED";
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-extrabold text-slate-700">{item.caseRef}</td>
                        <td className="p-4 font-bold text-slate-800"><User className="h-4 w-4 inline text-slate-400 mr-1"/>{item.claimant}</td>
                        <td className="p-4 text-slate-600 text-xs">{item.attorney||"—"}</td>
                        <td className="p-4 font-mono text-xs text-slate-500"><Calendar className="h-3.5 w-3.5 inline text-slate-400 mr-1"/>{item.accidentDate||"—"}</td>
                        <td className="p-4"><span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase rounded-full ${ok?"bg-emerald-100 text-emerald-800":fail?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{ok?<CheckCircle2 className="h-3 w-3"/>:fail?<AlertTriangle className="h-3 w-3"/>:<Loader2 className="h-3 w-3 animate-spin"/>}{item.status}</span></td>
                        <td className="p-4 text-right"><Link href={`/tool?caseId=${item.id}`} className="inline-flex items-center gap-1.5 border hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg"><FileText className="h-3.5 w-3.5 text-slate-400"/>Review</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
