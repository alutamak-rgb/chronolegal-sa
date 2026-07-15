"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, ShieldCheck, FileText, Upload, RefreshCw, CheckCircle, Lock, TrendingDown, BarChart3 } from "lucide-react";
import Link from "next/link";

interface MatrixItem {
  date: string; event: string; hospitalRecord: string; expertA: string; expertB: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH"; strategicAlert: string; sourcePage?: string;
}

const DEMO_DATA: MatrixItem[] = [
  { date: "2024-03-15 08:45", event: "Paramedics Arrive at Scene", hospitalRecord: "Patient found alert. GCS recorded as 15/15. No visible head trauma. C-spine cleared on scene.", expertA: "(Orthopaedic Report p.3) 'History suggests significant head strike against B-pillar. Paramedic report shows GCS 12 at scene.'", expertB: "(Industrial Psy. Report p.7) 'Claimant reports being confused and disorientated at scene — consistent with TBI and supporting loss of consciousness.'", riskLevel: "HIGH", strategicAlert: "CRITICAL: GCS score contradiction. Hospital baseline = 15/15 (fully alert). Both experts retroactively claim GCS 12 at scene. Opposing counsel will challenge the truthfulness of the initial GCS recording. Request original paramedic run sheet via subpoena.", sourcePage: "Hospital p.1, Ortho p.3, Ind Psych p.7" },
  { date: "2024-03-15 09:20", event: "Emergency Department Admission", hospitalRecord: "Triaged as Priority 3 (non-urgent). Soft tissue cervical strain noted. Prescribed Mybulen (ibuprofen+paracetamol). Advised to rest 3-5 days.", expertA: "(Orthopaedic Report p.4) 'Patient presented with severe cervical spine pain. Immediate imaging warranted. Missed C5-C6 disc herniation evident on later MRI.'", expertB: "—", riskLevel: "HIGH", strategicAlert: "ALERT: Hospital diagnosis of 'soft tissue strain' contradicts later finding of C5-C6 disc herniation. This is a common RAF defense tactic — arguing the injury is not accident-related but degenerative. Gather evidence of immediate post-accident complaint pattern.", sourcePage: "Hospital p.2, Ortho p.4" },
  { date: "2024-03-15 14:00", event: "Discharge from Hospital", hospitalRecord: "Patient discharged. Ambulatory. Advised to follow up with GP in 7 days if symptoms persist.", expertA: "(Orthopaedic Report p.5) 'Patient reports being unable to walk unaided for 2 weeks post-accident.'", expertB: "—", riskLevel: "MEDIUM", strategicAlert: "Gap alert: 14-day gap between discharge and first orthopaedic consult. RAF will argue insufficient injury severity. Obtain family affidavits and pharmacy records.", sourcePage: "Hospital p.4, Ortho p.5" },
  { date: "2024-04-01", event: "Return to Work Attempt", hospitalRecord: "(Patient self-report via RAF1 form) 'Returned to light duties on April 1. Full duties by April 15.'", expertA: "—", expertB: "(Industrial Psy. Report p.10) 'Claimant has been completely incapacitated since the accident. Has not worked a single day.'", riskLevel: "HIGH", strategicAlert: "FATAL CONTRADICTION: Claimant self-reported returning to work on RAF1 form. Industrial psychologist claims total incapacity. This will destroy the loss of earnings claim. Interview claimant immediately. Review bank deposits for April 2024.", sourcePage: "RAF1 form p.3, Ind Psych p.10" },
  { date: "2024-06-10", event: "Orthopaedic Surgery Scheduled", hospitalRecord: "—", expertA: "(Orthopaedic Report p.6) 'C5-C6 anterior cervical discectomy and fusion recommended. Estimated cost: R185,000. 6-12 month recovery.'", expertB: "(Industrial Psy. Report p.12) 'Post-surgical recovery will extend functional incapacity to minimum 18 months from accident date.'", riskLevel: "MEDIUM", strategicAlert: "Quantum impact: Surgery cost + 18-month loss of earnings. Ensure updated RAF4 Serious Injury Assessment is obtained post-surgery for the narrative test gate.", sourcePage: "Ortho p.6, Ind Psych p.12" },
];

export default function ChronolegalAnalysisTool() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseRef, setCaseRef] = useState("");
  const [attorney, setAttorney] = useState("");
  const [claimant, setClaimant] = useState("");
  const [accidentDate, setAccidentDate] = useState("");
  const [hospitalRecord, setHospitalRecord] = useState<File | null>(null);
  const [expertReportA, setExpertReportA] = useState<File | null>(null);
  const [expertReportB, setExpertReportB] = useState<File | null>(null);
  const [matrixData, setMatrixData] = useState<MatrixItem[]>([]);
  const [consented, setConsented] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const stats = useMemo(() => {
    const high = matrixData.filter(m => m.riskLevel === "HIGH").length;
    const med = matrixData.filter(m => m.riskLevel === "MEDIUM").length;
    const low = matrixData.filter(m => m.riskLevel === "LOW").length;
    const total = matrixData.length;
    const confidence = total > 0 ? Math.round(((total - high) / total) * 100) : 0;
    // Simple quantum risk estimate
    const quantumRisk = high * 300000 + med * 80000;
    return { high, med, low, total, confidence, quantumRisk };
  }, [matrixData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: string) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (slot === "hospital") setHospitalRecord(file);
      if (slot === "expertA") setExpertReportA(file);
      if (slot === "expertB") setExpertReportB(file);
    }
  };

  const loadDemoCase = () => {
    setCaseRef("RAF/2024/008921");
    setClaimant("Sipho Ndlovu");
    setAccidentDate("2024-03-15");
    setMatrixData(DEMO_DATA);
    setIsDemo(true);
    setReviewedCount(0);
    setStep(2);
  };

  const executeLiveAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!hospitalRecord || !expertReportA || !expertReportB) {
      setError("All three document slots are required.");
      setLoading(false);
      return;
    }
    setProcessingStage("Extracting text from documents...");
    const payload = new FormData();
    payload.append("caseRef", caseRef);
    payload.append("claimant", claimant);
    payload.append("accidentDate", accidentDate);
    payload.append("hospitalRecord", hospitalRecord);
    payload.append("expertReportA", expertReportA);
    payload.append("expertReportB", expertReportB);
    try {
      setProcessingStage("Cross-referencing hospital baseline against expert reports...");
      const response = await fetch("/api/analyze", { method: "POST", body: payload });
      setProcessingStage("Building discrepancy matrix...");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis failed.");
      setMatrixData(result.data);
      setIsDemo(false);
      setReviewedCount(0);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Processing fault.");
    } finally {
      setLoading(false);
      setProcessingStage("");
    }
  };

  const markReviewed = () => setReviewedCount(c => Math.min(c + 1, stats.total));

  const allFilesLoaded = hospitalRecord && expertReportA && expertReportB;
  const confPct = stats.total > 0 ? Math.min(100, Math.round(((stats.total - stats.high + reviewedCount) / stats.total) * 100)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="bg-slate-950 text-white text-xs py-2 px-4 flex justify-center items-center gap-6 font-mono">
        <span className="flex items-center gap-1.5"><Lock size={12} className="text-emerald-400"/> Servers: Johannesburg, South Africa</span>
        <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400"/> POPIA Compliant · Operator Agreement Available</span>
        <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-400"/> AES-256 Encryption · No Data Retention</span>
      </div>

      <header className="bg-slate-950 text-white px-8 py-4 flex justify-between items-center shadow-md border-t border-slate-800">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="bg-amber-500 font-bold px-2.5 py-1 rounded text-slate-950 text-sm">CL</div>
          <h1 className="text-xl font-bold tracking-tight">ChronoLegal <span className="text-amber-400">AI</span></h1>
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={loadDemoCase} className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-bold">Load Demo Case</button>
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">Home</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center gap-12 mb-10 text-sm font-semibold text-slate-400">
          <div className={`flex items-center gap-2 pb-2 border-b-2 ${step===1?"text-slate-900 border-amber-500":"text-amber-600 border-transparent"}`}><span>1. Capture Bundle Data</span></div>
          <div className={`flex items-center gap-2 pb-2 border-b-2 ${step===2?"text-slate-900 border-amber-500":"border-transparent"}`}><span>2. Cross-Comparative Review Matrix</span></div>
        </div>

        {error && (<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm"><AlertTriangle className="h-5 w-5 shrink-0"/><p>{error}</p></div>)}

        {step === 1 && (
          <form onSubmit={executeLiveAnalysis} className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div><h2 className="text-lg font-bold text-slate-800 border-b pb-3">Discrepancy Analysis Input</h2></div>
              <button type="button" onClick={loadDemoCase} className="text-xs text-amber-600 hover:text-amber-800 font-bold border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-all">← Try Demo Case First</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Case Reference / RAF Number *</label><input required type="text" value={caseRef} onChange={e=>setCaseRef(e.target.value)} placeholder="e.g. RAF/2024/008921" className="w-full px-4 py-2.5 border rounded-xl focus:outline-amber-500 text-sm bg-slate-50"/></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Claimant / Plaintiff *</label><input required type="text" value={claimant} onChange={e=>setClaimant(e.target.value)} placeholder="Sipho Ndlovu" className="w-full px-4 py-2.5 border rounded-xl focus:outline-amber-500 text-sm bg-slate-50"/></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Instructing Attorney *</label><input required type="text" value={attorney} onChange={e=>setAttorney(e.target.value)} placeholder="Your Full Name" className="w-full px-4 py-2.5 border rounded-xl focus:outline-amber-500 text-sm bg-slate-50"/></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Date of Accident *</label><input required type="date" value={accidentDate} onChange={e=>setAccidentDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl focus:outline-amber-500 text-sm bg-slate-50"/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {[
                { key: "hospital", title: "Hospital Record", file: hospitalRecord, subtitle: "Admission sheets, trauma charts, discharge summary" },
                { key: "expertA", title: "Expert Report A", file: expertReportA, subtitle: "Orthopaedic surgeon, neurosurgeon, etc." },
                { key: "expertB", title: "Expert Report B", file: expertReportB, subtitle: "Occupational therapist, industrial psychologist" },
              ].map(slot => (
                <div key={slot.key} className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all ${slot.file?"border-emerald-500 bg-emerald-50/30":"border-slate-200 hover:border-amber-400 bg-slate-50/50"}`}>
                  {slot.file ? <FileText className="h-10 w-10 text-emerald-600 mb-3"/> : <Upload className="h-10 w-10 text-slate-400 mb-3"/>}
                  <h3 className="text-sm font-bold text-slate-700">{slot.title}</h3>
                  <p className="text-xs text-slate-400 px-2 mt-1 mb-4">{slot.subtitle}</p>
                  <label className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${slot.file?"bg-emerald-600 text-white":"bg-white border text-slate-700 hover:bg-slate-100"}`}>
                    {slot.file ? "File Loaded ✓" : "Choose File"}
                    <input type="file" accept=".txt,.pdf" onChange={e=>handleFileUpload(e,slot.key)} className="hidden"/>
                  </label>
                  {slot.file && <span className="text-[10px] text-slate-500 mt-2 truncate max-w-xs">{slot.file.name}</span>}
                </div>
              ))}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-slate-500 mt-0.5 shrink-0"/>
                <div>
                  <span className="font-bold block mb-1">POPIA Data Processing Notice</span>
                  <p>By uploading documents, you confirm: (1) You are the responsible party as defined in POPIA; (2) You have client consent or lawful basis to process this data; (3) ChronoLegal acts as your operator per Section 21. Files are processed in Johannesburg, South Africa, encrypted with AES-256, and permanently deleted within 24 hours. Only the derived, anonymized chronological matrix is retained.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={consented} onChange={e=>setConsented(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"/><span className="font-medium">I confirm client consent and accept the data processing terms above.</span></label>
            </div>
            <div className="pt-6 border-t flex justify-between items-center">
              <p className="text-xs text-slate-400">All files encrypted with AES-256 · Deleted within 24 hours</p>
              <button type="submit" disabled={loading || !allFilesLoaded || !consented} className="bg-slate-950 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-3 shadow hover:bg-slate-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? <><RefreshCw className="h-5 w-5 animate-spin text-amber-400"/>Analysing Trial Bundle...</> : "Execute Discrepancy Engine"}
              </button>
            </div>
            {loading && processingStage && (<div className="text-center py-4"><p className="text-sm text-slate-500 font-mono animate-pulse">{processingStage}</p></div>)}
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* RISK SUMMARY DASHBOARD */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <span className="text-xs font-mono px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold">{isDemo ? "DEMO CASE" : "LIVE INTELLIGENCE MATRIX"}</span>
                  <h2 className="text-xl font-extrabold text-slate-800 mt-2">Matter: {claimant||"Claimant"}</h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Ref: {caseRef} · Date: {accidentDate}{isDemo ? " · Sample" : ""}</p>
                </div>
                <button onClick={()=>setStep(1)} className="border font-bold text-xs px-4 py-2.5 rounded-xl bg-white text-slate-700 hover:bg-slate-50">← New Bundle</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <div className="text-2xl font-extrabold text-red-700">{stats.high}</div>
                  <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-1">Critical</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                  <div className="text-2xl font-extrabold text-amber-700">{stats.med}</div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-1">Significant</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <div className="text-2xl font-extrabold text-blue-700">{stats.low}</div>
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">Minor</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-2xl font-extrabold text-slate-700">{confPct}%</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Confidence</div>
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-2"><div className="bg-amber-500 h-1 rounded-full transition-all" style={{width:`${confPct}%`}}></div></div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1"><TrendingDown size={14} className="text-amber-600"/><span className="text-lg font-extrabold text-amber-700">R{stats.quantumRisk.toLocaleString()}</span></div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-1">Quantum at Risk</div>
                </div>
              </div>

              {stats.high > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
                  <div>
                    <span className="font-bold">{stats.high} critical contradictions</span> detected. If unaddressed, the RAF's medico-legal team will exploit these — potentially reducing quantum by an estimated <strong>R{stats.quantumRisk.toLocaleString()}</strong>. Address before the joint expert minute.
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <BarChart3 size={12}/>
                <span>Confidence improves as you review and reconcile flagged contradictions. Aim for 90%+ before Rule 37.</span>
              </div>
            </div>

            {/* MATRIX TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-950 text-white font-mono uppercase text-xs tracking-wider">
                    <tr>
                      <th className="p-4 border-b w-28">Date</th>
                      <th className="p-4 border-b w-40">Event</th>
                      <th className="p-4 border-b">Hospital Baseline</th>
                      <th className="p-4 border-b">Expert Report A</th>
                      <th className="p-4 border-b">Expert Report B</th>
                      <th className="p-4 border-b w-24">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {matrixData.map((item, index) => {
                      const isHigh = item.riskLevel === "HIGH";
                      const isMed = item.riskLevel === "MEDIUM";
                      return (
                        <React.Fragment key={index}>
                          <tr className={`transition-all ${isHigh?"bg-red-50/40":isMed?"bg-amber-50/30":"hover:bg-slate-50"}`}>
                            <td className="p-4 font-mono font-bold text-slate-600 align-top text-xs">{item.date}</td>
                            <td className="p-4 font-bold text-slate-800 align-top">{item.event}</td>
                            <td className="p-4 text-slate-600 text-xs leading-relaxed align-top">{item.hospitalRecord||"—"}</td>
                            <td className="p-4 text-slate-600 text-xs leading-relaxed align-top">{item.expertA||"—"}</td>
                            <td className="p-4 text-slate-600 text-xs leading-relaxed align-top">{item.expertB||"—"}</td>
                            <td className="p-4 align-top">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-wide rounded-full ${isHigh?"bg-red-100 text-red-800":isMed?"bg-amber-100 text-amber-800":"bg-emerald-100 text-emerald-800"}`}>
                                {isHigh && <AlertTriangle className="h-3 w-3"/>}{item.riskLevel}
                              </span>
                            </td>
                          </tr>
                          {(isHigh||isMed) && (
                            <tr className={isHigh?"bg-red-50/40":"bg-amber-50/30"}>
                              <td colSpan={6} className="px-4 pb-4 pt-0">
                                <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${isHigh?"border-red-200 bg-white text-red-900":"border-amber-200 bg-white text-amber-900"}`}>
                                  <ShieldCheck className={`h-4 w-4 shrink-0 mt-0.5 ${isHigh?"text-red-600":"text-amber-600"}`}/>
                                  <div className="flex-1">
                                    <span className="font-extrabold uppercase font-mono text-[10px] block mb-1">Defense Vulnerability Warning:</span>
                                    <p className="mb-2">{item.strategicAlert}</p>
                                    {item.sourcePage && (
                                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-200 pt-2 mt-2">
                                        <span>📄 Source: {item.sourcePage}</span>
                                        <button onClick={markReviewed} className="text-amber-600 hover:text-amber-800 font-bold">✓ Mark Reviewed</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
