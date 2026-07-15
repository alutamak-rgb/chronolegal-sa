import Tesseract from 'tesseract.js';

interface OCRResult {
  text: string;
  pagesCount: number;
  confidence: number;
  isMock: boolean;
}

/**
 * Real OCR using Tesseract.js — runs locally, no external API needed.
 * Falls back to mock parser when Tesseract isn't available (e.g., in Railway build).
 */
async function tesseractOCR(imageBuffer: Buffer): Promise<{text: string; confidence: number}> {
  try {
    const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`🔍 [OCR]: ${Math.round(m.progress * 100)}% complete`);
        }
      },
    });
    return { text: data.text, confidence: data.confidence / 100 };
  } catch (err: any) {
    console.warn(`⚠️ [OCR]: Tesseract failed — ${err.message}. Falling back to mock.`);
    throw err;
  }
}

/**
 * High-fidelity OCR extraction designed for messy/handwritten SA hospital records.
 * Attempts real Tesseract OCR first; falls back to realistic mock extraction.
 */
export async function performHeavyOCR(
  fileBuffer: Buffer,
  mimeType: string
): Promise<OCRResult> {
  console.log(`📥 [OCR Ingestion]: Processing ${(fileBuffer.length / 1024).toFixed(1)}KB document (${mimeType})...`);

  // Try real OCR first
  try {
    const result = await tesseractOCR(fileBuffer);
    if (result.text.trim().length > 50) {
      console.log(`✅ [OCR]: Real extraction succeeded — ${result.text.length} chars, ${Math.round(result.confidence * 100)}% confidence`);
      return {
        text: result.text,
        pagesCount: 1,
        confidence: result.confidence,
        isMock: false,
      };
    }
  } catch {
    // Tesseract failed — use mock fallback
  }

  // Mock fallback for demo/development
  console.log('🛠️ [OCR]: Executing Mock Parser Fallback...');
  await new Promise(resolve => setTimeout(resolve, 1200));

  return {
    text: generateMockSAHospitalRecord(),
    pagesCount: 1,
    confidence: 0.91,
    isMock: true,
  };
}

/**
 * Generates a realistic SA hospital record mock for demo purposes.
 * Mimics the type of text found in RAF case bundles from state hospitals.
 */
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
Name: [REDACTED — Protected Health Information]
ID Number: [REDACTED]
Age: 34
Sex: Male

CLINICAL HISTORY
Patient involved in motor vehicle accident (MVA) as driver. Side-impact collision. Seatbelt worn. Airbag deployed. No loss of consciousness reported by paramedics at scene. Patient complains of severe neck pain radiating to right shoulder, lower back pain, and headache.

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
Oxygen Saturation: 97% on room air

EXAMINATION FINDINGS
Head/Neck: No visible lacerations. Tenderness over C5-C7 spinous processes. Limited range of motion — pain on rotation and flexion.
Chest: Seatbelt contusion across left clavicle. Clear breath sounds bilaterally.
Abdomen: Soft, non-tender. No guarding or rigidity.
Spine: Midline tenderness L3-L5. No step deformity.
Extremities: Full range of motion all limbs. Distal pulses present.

IMAGING
X-Ray Cervical Spine: No acute fracture identified. Loss of cervical lordosis — ?muscle spasm.
CT Brain: No intracranial haemorrhage or mass effect. Skull intact.
X-Ray Lumbar Spine: No acute fracture. Degenerative changes at L4-L5.

MEDICATION ADMINISTERED
- Tramadol 50mg IV (analgesia)
- Mybulen 2 tablets PO (ibuprofen 400mg + paracetamol 500mg)
- Diazepam 5mg PO (muscle relaxant)

PLAN
1. Admit to Observation Ward for neurological monitoring (24 hours)
2. Refer to Orthopaedic Clinic — ?MRI cervical spine outpatient
3. Physiotherapy referral for cervical and lumbar strain
4. Discharge pending: Neuro-observation stable, pain controlled on oral analgesia, mobilising independently

DISCHARGE SUMMARY
Date of Discharge: 14/04/2024
Discharge Diagnosis: Whiplash Associated Disorder Grade II. Musculoligamentous strain cervical and lumbar spine.
Follow-up: Orthopaedic Outpatient Clinic — 21/04/2024. Physiotherapy — twice weekly for 6 weeks.
Medication on Discharge: Mybulen 2 tablets TDS. Tramadol 50mg BD PRN.
Fit for Work: Booked off until 05/05/2024.

--- END OF RECORD ---`;
}
