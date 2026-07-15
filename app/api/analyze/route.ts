import { NextRequest, NextResponse } from "next/server";

async function readFormFile(file: any): Promise<string> {
  try {
    // Web File API
    if (typeof file.text === 'function') return await file.text();
  } catch {}
  try {
    // Node.js buffer / Blob
    if (typeof file.arrayBuffer === 'function') {
      return Buffer.from(await file.arrayBuffer()).toString('utf-8');
    }
  } catch {}
  try {
    // Raw bytes from stream
    const chunks: Uint8Array[] = [];
    const reader = file.stream().getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8');
  } catch {}
  // Last resort: convert to string
  return String(file);
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

    const formData = await req.formData();
    const caseRef = (formData.get("caseRef") as string) || "";
    const claimant = (formData.get("claimant") as string) || "";
    const accidentDate = (formData.get("accidentDate") as string) || "";

    const hospitalFile = formData.get("hospitalRecord");
    const expertAFile = formData.get("expertReportA");
    const expertBFile = formData.get("expertReportB");

    if (!hospitalFile || !expertAFile || !expertBFile) {
      return NextResponse.json({ error: "Missing required files." }, { status: 400 });
    }

    const hospitalText = await readFormFile(hospitalFile);
    const expertAText = await readFormFile(expertAFile);
    const expertBText = await readFormFile(expertBFile);

    if (!hospitalText.trim() || !expertAText.trim() || !expertBText.trim()) {
      return NextResponse.json({ error: "One or more files appear to be empty." }, { status: 400 });
    }

    const systemInstruction = `You are an elite South African Medico-Legal Advocate and Quantum Litigation Strategist. 
Analyze the provided clinical records for Claimant ${claimant} (Case Ref: ${caseRef}, MVA Date: ${accidentDate}).

Construct a highly detailed side-by-side comparative analysis matrix. Identify clinical events, dates, and assessments.
Your PRIMARY mandate: catch contradictions between the initial hospital documentation and subsequent expert opinions.

Look for SA RAF pitfalls: GCS variations, LOC contradictions, employability findings contradicted by actual capacity, treatment gaps.

Return valid JSON array: Array<{ date, event, hospitalRecord, expertA, expertB, riskLevel: "LOW"|"MEDIUM"|"HIGH", strategicAlert }>
Return raw JSON array text only — no markdown, no code blocks.`;

    const userPrompt = `=== SOURCE 1: HOSPITAL RECORD ===
${hospitalText}

=== SOURCE 2: EXPERT REPORT A ===
${expertAText}

=== SOURCE 3: EXPERT REPORT B ===
${expertBText}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat", temperature: 0.1,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: `AI error: ${data.error?.message || response.status}` }, { status: 502 });

    const content = data.choices?.[0]?.message?.content || "[]";
    const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data: parsed });

  } catch (error: any) {
    console.error("Analysis Pipeline Failed:", error);
    return NextResponse.json({ error: "Analysis failed.", details: error.message }, { status: 500 });
  }
}
