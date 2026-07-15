import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

    const formData = await req.formData();
    const caseRef = formData.get("caseRef") as string;
    const claimant = formData.get("claimant") as string;
    const accidentDate = formData.get("accidentDate") as string;

    const hospitalFile = formData.get("hospitalRecord") as File | null;
    const expertAFile = formData.get("expertReportA") as File | null;
    const expertBFile = formData.get("expertReportB") as File | null;

    if (!hospitalFile || !expertAFile || !expertBFile) {
      return NextResponse.json({ error: "Missing required files. All three records needed." }, { status: 400 });
    }

    const hospitalText = await hospitalFile.text();
    const expertAText = await expertAFile.text();
    const expertBText = await expertBFile.text();

    const systemInstruction = `You are an elite South African Medico-Legal Advocate and Quantum Litigation Strategist. 
Analyze the provided clinical records for Claimant ${claimant} (Case Ref: ${caseRef}, MVA Date: ${accidentDate}).

Construct a highly detailed side-by-side comparative analysis matrix. 
Identify specific clinical events, dates, and assessments. Your PRIMARY mandate is to catch 
defensibility flaws and contradictions between the initial hospital documentation and the subsequent expert opinions.

Look explicitly for common South African RAF and negligence pitfalls:
- Variations in Glasgow Coma Scale (GCS) markers.
- Self-reported loss of consciousness (LOC) contradicting objective paramedic/trauma sheets.
- Industrial psychologist employability conclusions contradicted by actual payroll data or immediate return to work.
- Unexplained gaps in continuity of treatment.

You must strictly return a valid JSON array matching this interface:
Array<{
  date: string;
  event: string;
  hospitalRecord: string;
  expertA: string;
  expertB: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  strategicAlert: string;
}>

Return raw valid JSON array text only. No markdown, no code blocks.`;

    const userPrompt = `=== SOURCE 1: INITIAL STATE HOSPITAL RECORD ===
${hospitalText}

=== SOURCE 2: EXPERT REPORT A ===
${expertAText}

=== SOURCE 3: EXPERT REPORT B ===
${expertBText}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.1,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: `AI engine error: ${data.error?.message || response.status}` }, { status: 502 });

    const content = data.choices?.[0]?.message?.content || "[]";
    // DeepSeek sometimes wraps JSON in markdown
    const cleaned = content.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data: parsed });

  } catch (error: any) {
    console.error("Analysis Pipeline Failed:", error);
    return NextResponse.json({ error: "Failed to parse legal documents.", details: error.message }, { status: 500 });
  }
}
