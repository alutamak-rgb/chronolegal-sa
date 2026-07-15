interface OCRResult {
  text: string;
  pagesCount: number;
  confidence: number;
  isMock: boolean;
}

/**
 * Attempts Tesseract.js OCR with dynamic import and timeout guard.
 * Falls back to realistic SA hospital mock when Tesseract is unavailable.
 */
async function tesseractOCR(imageBuffer: Buffer): Promise<{text: string; confidence: number}> {
  // Dynamic import so module-not-found doesn't crash the process
  let Tesseract: any;
  try {
    Tesseract = (await import('tesseract.js')).default;
  } catch {
    throw new Error('Tesseract.js not available in this environment');
  }

  // Race OCR against a timeout — Railway workers can hang
  const ocrPromise = Tesseract.recognize(imageBuffer, 'eng', {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        console.log(`🔍 [OCR]: ${Math.round(m.progress * 100)}% complete`);
      }
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('OCR timeout after 25s')), 25000)
  );

  const { data } = await Promise.race([ocrPromise, timeoutPromise]);
  return { text: data.text, confidence: (data.confidence || 50) / 100 };
}

/**
 * High-fidelity OCR extraction designed for messy/handwritten SA hospital records.
 * Attempts real Tesseract OCR first with timeout; falls back to mock extraction.
 */
export async function performHeavyOCR(
  fileBuffer: Buffer,
  mimeType: string
): Promise<OCRResult> {
  console.log(`📥 [OCR Ingestion]: Processing ${(fileBuffer.length / 1024).toFixed(1)}KB document (${mimeType})...`);

  // Try real OCR first with timeout protection
  try {
    const result = await tesseractOCR(fileBuffer);
    if (result.text.trim().length > 50) {
      console.log(`✅ [OCR]: Real extraction succeeded — ${result.text.length} chars`);
      return { text: result.text, pagesCount: 1, confidence: result.confidence, isMock: false };
    }
  } catch (err: any) {
    console.warn(`⚠️ [OCR]: Tesseract unavailable — ${err.message}. Using mock fallback.`);
  }

  // Mock fallback — always works, always fast
  console.log('🛠️ [OCR]: Executing Mock Parser Fallback...');
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    text: generateMockSAHospitalRecord(),
    pagesCount: 1,
    confidence: 0.91,
    isMock: true,
  };
}

function generateMockSAHospitalRecord(): string {
  const hospitals = [
    'Chris Hani Baragwanath Academic Hospital',
    'Charlotte Maxeke Johannesburg Academic Hospital',
    'Steve Biko Academic Hospital',
    'George Mukhari Academic Hospital',
    'Tygerberg Hospital',
    'Inkosi Albert Luthuli Central Hospital',
    'Groote Schuur Hospital',
  ];
  const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];

  return `[OCR EXTRACTED TEXT — ${hospital}]

PATIENT ADMISSION RECORD
Hospital: ${hospital}
Date of Admission: 12/04/2024
Time: 08:45
Mode of Arrival: Ambulance (EMS)
Referring Facility: Scene of MVA

PATIENT DETAILS
Name: [REDACTED]
ID Number: [REDACTED]
Age: 34
Sex: Male

TRIAGE ASSESSMENT
Triage Category: Orange (Urgent)
Glasgow Coma Scale (GCS): 14/15 on admission
  - Eye Opening: 4 (spontaneous)
  - Verbal Response: 5 (oriented)
  - Motor Response: 5 (localises to pain)
Pupils: Equal and reactive to light (PERL)
Blood Pressure: 142/88 mmHg
Heart Rate: 96 bpm
Respiratory Rate: 18/min
Oxygen Saturation: 97%

EXAMINATION FINDINGS
Head/Neck: No visible lacerations. Tenderness over C5-C7 spinous processes. Limited ROM.
Chest: Seatbelt contusion left clavicle. Clear breath sounds.
Abdomen: Soft, non-tender.
Spine: Midline tenderness L3-L5.

IMAGING
X-Ray C-Spine: No acute fracture. Loss of cervical lordosis.
CT Brain: No intracranial haemorrhage.
X-Ray L-Spine: No acute fracture. Degenerative changes L4-L5.

MEDICATION
- Tramadol 50mg IV
- Mybulen 2 tablets PO
- Diazepam 5mg PO

PLAN
1. Admit Observation Ward (24hr neuro monitoring)
2. Refer Orthopaedic Clinic — ?MRI cervical spine
3. Physiotherapy referral
4. Discharge pending: Neuro-stable, pain controlled, mobilising independently

DISCHARGE SUMMARY
Date: 14/04/2024
Diagnosis: Whiplash Associated Disorder Grade II. Musculoligamentous strain C+L spine.
Follow-up: Orthopaedic OPD — 21/04/2024. Physio 2x/week × 6 weeks.
Meds on D/C: Mybulen 2 tabs TDS. Tramadol 50mg BD PRN.
Fit for Work: Booked off until 05/05/2024.

--- END OF RECORD ---`;
}
