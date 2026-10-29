/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentApplication, UploadedDocItem } from '../types/admissions';
import { extractCandidateNameFromText } from './nameVerificationService';

export interface OcrFieldDefinition {
  key: string;
  label: string;
  submittedValue: string;
  extractedValue: string;
}

/**
 * Creates realistic structured OCR extracted fields for a given document slot.
 * If simulateMismatch is true, introduces deliberate discrepancies for testing.
 */
export function createDefaultOcrPayloadForDoc(
  slotKey: string,
  app: StudentApplication,
  simulateMismatch: boolean = false
): Record<string, string | number> {
  const p = app.personal;
  const t = app.tenth;
  const hsc = app.twelfth;
  const cert = app.certificates;
  const sp = app.specialCategory;

  switch (slotKey) {
    case 'aadhaarCard':
      return {
        name: simulateMismatch ? 'Karthick Ramanathan' : p.fullName || 'Karthik Ramanathan',
        dob: simulateMismatch ? '2005-01-01' : p.dob || '2007-05-14',
        aadhaarNumber: simulateMismatch
          ? '9845 2210 0000'
          : cert.aadhaarNumber || '9845 2210 9812',
        gender: p.gender || 'Male',
      };

    case 'tenthMarksheet':
      return {
        studentName: simulateMismatch ? 'R. Karthik' : p.fullName || 'Karthik Ramanathan',
        registerNumber: simulateMismatch
          ? 'TN-SSLC-998811'
          : t.registerNumber || 'TN-SSLC-489201',
        schoolName: simulateMismatch
          ? 'Government Higher Secondary School, Erode'
          : t.schoolName || 'Stanes Higher Secondary School',
        totalMarks: simulateMismatch ? 390 : t.totalMarks || 486,
        marksheetNumber: simulateMismatch ? 'SSLC-2024-00000' : t.marksheetNumber || 'SSLC-2024-99812',
      };

    case 'tenthTc':
      return {
        schoolName: simulateMismatch
          ? 'Government Higher Secondary School, Erode'
          : t.schoolName || 'Stanes Higher Secondary School',
        tcNumber: simulateMismatch ? 'TC-DISCREPANT-999' : t.tcNumber || 'TC-STANES-0841',
      };

    case 'twelfthMarksheet':
      return {
        studentName: simulateMismatch ? 'R. Karthik' : p.fullName || 'Karthik Ramanathan',
        registerNumber: simulateMismatch
          ? 'TN-HSC-000111'
          : hsc.registerNumber || 'TN-HSC-789104',
        mathsMarks: simulateMismatch ? 70 : hsc.mathsMarks || 96,
        physicsMarks: simulateMismatch ? 65 : hsc.physicsMarks || 94,
        chemistryMarks: simulateMismatch ? 60 : hsc.chemistryMarks || 92,
      };

    case 'twelfthTc':
      return {
        schoolName: simulateMismatch
          ? 'Government Higher Secondary School, Erode'
          : hsc.schoolName || 'Stanes Higher Secondary School',
        tcNumber: simulateMismatch ? 'TC-DISCREPANT-888' : hsc.tcNumber || 'TC-STANES-1204',
      };

    case 'communityCert':
      return {
        category: simulateMismatch ? 'MBC / DNC' : sp.community || 'BC',
        certNumber: simulateMismatch
          ? 'TN-COMM-DIFF-0000'
          : cert.communityCertNumber || 'TN-COMM-2024-99812',
        issuingAuthority: 'Zonal Deputy Tahsildar, Revenue Department',
      };

    case 'incomeCert':
      return {
        certNumber: simulateMismatch
          ? 'TN-INC-DIFF-0000'
          : cert.incomeCertNumber || 'TN-INC-2024-88912',
        annualIncome: simulateMismatch ? '₹ 4,50,000 / annum' : '₹ 1,80,000 / annum',
      };

    case 'birthCert':
      return {
        childName: p.fullName || 'Karthik Ramanathan',
        dob: simulateMismatch ? '2005-01-01' : p.dob || '2007-05-14',
        registrationNumber: cert.birthCertNumber || 'TN-MC-2007-00918',
        fatherName: p.fatherName || 'Ramanathan Krishnan',
        motherName: p.motherName || 'Lakshmi Ramanathan',
      };

    case 'photo':
      return {
        dimensions: '3.5 x 4.5 cm',
        background: 'Clean White Neutral',
        facialConfidence: '99.2%',
      };

    default:
      return {
        extractedText: 'Document OCR processed successfully. Cryptographic stamp valid.',
      };
  }
}

/**
 * Returns a human-readable OCR raw text token dump for inspection.
 */
export function generateRawOcrText(
  slotKey: string,
  payload: Record<string, string | number>
): string {
  const lines: string[] = [`=== OCR TOKEN STREAM [${slotKey.toUpperCase()}] ===`];
  lines.push(`SCAN_ENGINE: Authentix OCR Neural Engine v3.4`);
  lines.push(`CONFIDENCE: 98.6% (BBOX ALIGNED)`);
  lines.push('----------------------------------------');

  // Insert explicit candidate name print line if present
  const cName = payload.name || payload.studentName || payload.childName;
  if (cName) {
    lines.push(`Candidate Name: ${cName}`);
  }

  for (const [k, v] of Object.entries(payload)) {
    lines.push(`TOKEN_${k.toUpperCase()}: "${v}"`);
  }
  lines.push('----------------------------------------');
  lines.push('CHECKSUM: SHA-256 VALIDATED');
  return lines.join('\n');
}

/**
 * Parses raw text streams inside PDF buffers directly.
 * Handles both uncompressed text streams and FlateDecode streams.
 */
export async function extractTextFromPdfRaw(data: Uint8Array): Promise<string> {
  let binaryString = '';
  // Convert Uint8Array to binary string in chunks to avoid stack overflow
  const chunkSize = 8192;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, Math.min(i + chunkSize, data.length));
    binaryString += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  const texts: string[] = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binaryString)) !== null) {
    const rawStream = match[1];
    let decodedText = '';

    // If running in Node.js environment:
    const isNode = typeof process !== 'undefined' && !!process.versions?.node;
    if (isNode) {
      try {
        const zlib = await import('zlib');
        const buffer = Buffer.from(rawStream, 'binary');
        try {
          decodedText = zlib.inflateSync(buffer).toString('utf-8');
        } catch {
          try {
            decodedText = zlib.inflateRawSync(buffer).toString('utf-8');
          } catch {
            // Not compressed or invalid deflate stream
          }
        }
      } catch {
        // zlib module unavailable
      }
    }

    // If running in browser environment with native DecompressionStream:
    if (!decodedText && !isNode && typeof DecompressionStream !== 'undefined') {
      try {
        const streamBytes = new Uint8Array(rawStream.length);
        for (let i = 0; i < rawStream.length; i++) {
          streamBytes[i] = rawStream.charCodeAt(i);
        }
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        await writer.write(streamBytes).catch(() => {});
        await writer.close().catch(() => {});
        const response = new Response(ds.readable);
        decodedText = await response.text().catch(() => '');
      } catch {
        // DecompressionStream fallback
      }
    }

    if (!decodedText) {
      decodedText = rawStream;
    }

    // Extract Tj operators: (text) Tj
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(decodedText)) !== null) {
      texts.push(tjMatch[1]);
    }

    // Extract TJ array operators: [(t) 10 (e)] TJ
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = tjArrayRegex.exec(decodedText)) !== null) {
      const innerStrings = arrayMatch[1].match(/\(([^)]+)\)/g);
      if (innerStrings) {
        texts.push(innerStrings.map((s) => s.slice(1, -1)).join(''));
      }
    }
  }

  // Fallback: search for direct text string patterns inside binary
  if (texts.length === 0) {
    const directRegex = /\(([A-Za-z0-9\s:,\.\-\/]{3,100})\)/g;
    let directMatch: RegExpExecArray | null;
    while ((directMatch = directRegex.exec(binaryString)) !== null) {
      texts.push(directMatch[1]);
    }
  }

  return texts.join('\n');
}

/**
 * Extracts text from PDF using pdfjs-dist
 */
async function extractTextFromPdfWithPdfJs(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    const pieces: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: unknown) => {
          if (item && typeof item === 'object' && 'str' in item) {
            return String((item as { str: string }).str);
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');
      if (pageText.trim()) pieces.push(pageText.trim());
    }
    return pieces.join('\n');
  } catch (err) {
    console.warn('pdfjs-dist extraction notice:', err);
    return '';
  }
}

/**
 * Universal PDF Text Stream Extractor (combines raw stream parsing and pdfjs-dist)
 */
export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);

  // 1. Raw Stream Extraction (instantaneous, zero overhead)
  try {
    const rawText = await extractTextFromPdfRaw(bytes);
    if (rawText && rawText.trim().length > 10) {
      return rawText.trim();
    }
  } catch (err) {
    console.warn('Raw PDF stream parsing notice:', err);
  }

  // 2. pdfjs-dist fallback
  try {
    const pdfJsText = await extractTextFromPdfWithPdfJs(buffer);
    if (pdfJsText && pdfJsText.trim().length > 0) {
      return pdfJsText.trim();
    }
  } catch (err) {
    console.warn('pdfjs-dist fallback notice:', err);
  }

  return '';
}

/**
 * Extracts text from image files (PNG, JPG, JPEG, WEBP) using Tesseract.js OCR
 */
export async function extractTextFromImage(fileOrBlob: Blob | File): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const ret = await worker.recognize(fileOrBlob);
    await worker.terminate();
    return ret.data.text || '';
  } catch (err) {
    console.warn('Image OCR extraction notice:', err);
    return '';
  }
}

/**
 * Parses structured candidate fields from inside document text.
 * Strictly uses in-document text lines (never filename).
 */
export function parseFieldsFromInDocText(
  text: string,
  slotKey: string
): {
  extractedName: string | null;
  fields: Record<string, string | number>;
} {
  const fields: Record<string, string | number> = {};
  if (!text || !text.trim()) {
    return { extractedName: null, fields };
  }

  // 1. Candidate Name
  const candidateName = extractCandidateNameFromText(text, slotKey);
  if (candidateName) {
    fields.name = candidateName;
    fields.studentName = candidateName;
    fields.childName = candidateName;
  }

  // 2. Date of Birth
  const dobMatch = text.match(
    /(?:DOB|Date\s+of\s+Birth|Birth\s+Date)\s*[:\-]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/i
  );
  if (dobMatch && dobMatch[1]) {
    let dStr = dobMatch[1].replace(/[\/\.]/g, '-');
    const parts = dStr.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    fields.dob = dStr;
  }

  // 3. Register / Roll Number (requires colon or explicit No/Number)
  const regMatch =
    text.match(/(?:Register|Registration|Reg|Roll|Hall\s*Ticket)\s*(?:No|Number|#)?\s*[:\-]\s*([A-Za-z0-9\-]+)/i) ||
    text.match(/(?:Register|Registration|Reg|Roll)\s+(?:No|Number|#)\s+([A-Za-z0-9\-]+)/i);
  if (regMatch && regMatch[1]) {
    fields.registerNumber = regMatch[1].trim();
  }

  // 4. Aadhaar Number (12 digits)
  const aadhMatch = text.match(/\b(\d{4}\s\d{4}\s\d{4})\b/) || text.match(/\b(\d{12})\b/);
  if (aadhMatch && aadhMatch[1]) {
    const rawDigits = aadhMatch[1].replace(/\s+/g, '');
    fields.aadhaarNumber = `${rawDigits.slice(0, 4)} ${rawDigits.slice(4, 8)} ${rawDigits.slice(8, 12)}`;
  }

  // 5. Gender
  const genderMatch = text.match(/\b(Male|Female|Transgender)\b/i);
  if (genderMatch && genderMatch[1]) {
    fields.gender = genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1).toLowerCase();
  }

  // 6. Marks (Maths, Physics, Chemistry, Total)
  const mathsMatch = text.match(/(?:Mathematics|Maths|Math)\s*[:\-]?\s*(\d{1,3})/i);
  if (mathsMatch && mathsMatch[1]) fields.mathsMarks = Number(mathsMatch[1]);

  const physMatch = text.match(/(?:Physics|Phys)\s*[:\-]?\s*(\d{1,3})/i);
  if (physMatch && physMatch[1]) fields.physicsMarks = Number(physMatch[1]);

  const chemMatch = text.match(/(?:Chemistry|Chem)\s*[:\-]?\s*(\d{1,3})/i);
  if (chemMatch && chemMatch[1]) fields.chemistryMarks = Number(chemMatch[1]);

  const totalMatch = text.match(/(?:Total\s*Marks|Total|Grand\s*Total)\s*(?:Marks)?\s*[:\-]?\s*(\d{2,4})/i);
  if (totalMatch && totalMatch[1]) fields.totalMarks = Number(totalMatch[1]);

  // 7. TC Number
  const tcMatch = text.match(/(?:TC|Transfer\s*Certificate)\s*(?:No|Number)?\s*[:\-]?\s*([A-Za-z0-9\-]+)/i);
  if (tcMatch && tcMatch[1]) fields.tcNumber = tcMatch[1].trim();

  // 8. Community / Category
  const commMatch = text.match(
    /(?:Community|Category|Caste)\s*[:\-]?\s*(OC|BC|MBC\s*\/\s*DNC|MBC|SC|ST|BCM|DNC|General)/i
  );
  if (commMatch && commMatch[1]) fields.category = commMatch[1].trim().toUpperCase();

  // 9. Certificate Numbers (Community / Income)
  const certMatch = text.match(/(?:Cert|Certificate)\s*(?:No|Number|Ref)?\s*[:\-]?\s*([A-Za-z0-9\-]+)/i);
  if (certMatch && certMatch[1]) fields.certNumber = certMatch[1].trim();

  // 10. School / Institution
  const schoolMatch = text.match(/(?:School|Institution|College)\s*[:\-]?\s*([A-Za-z0-9\s,\.\-]+?)(?=\n|\r|$)/i);
  if (schoolMatch && schoolMatch[1] && schoolMatch[1].trim().length > 3) {
    fields.schoolName = schoolMatch[1].trim();
  }

  return {
    extractedName: candidateName,
    fields,
  };
}

/**
 * Processes an uploaded file (image or PDF) by extracting text strictly from INSIDE the document bytes.
 * NOTE: Filename extraction is deliberately eliminated.
 */
export async function processUploadedFileWithOcr(
  file: File,
  slotKey: string,
  _app: StudentApplication
): Promise<UploadedDocItem> {
  const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const previewUrl = isImg ? URL.createObjectURL(file) : undefined;

  let inDocRawText = '';

  try {
    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      inDocRawText = await extractTextFromPdf(arrayBuffer);
    } else if (isImg) {
      inDocRawText = await extractTextFromImage(file);
    } else {
      // Plain text or CSV or other formats
      inDocRawText = await file.text();
    }
  } catch (err) {
    console.warn(`Could not extract text from file ${file.name}:`, err);
  }

  // Parse in-document text (NEVER extract candidate name from file.name)
  const parsed = parseFieldsFromInDocText(inDocRawText, slotKey);

  // If inDocRawText is empty (e.g. blank scan or unrecognized binary)
  const rawOcr = inDocRawText.trim()
    ? inDocRawText.trim()
    : `=== DOCUMENT CONTENT SCANNER ===\nFILE: ${file.name}\nSTATUS: No text detected inside document.\nNOTE: Ensure the document contains clear printed text.`;

  return {
    id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: file.name,
    type: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    uploadDate: new Date().toISOString().split('T')[0],
    previewUrl,
    extractedName: parsed.extractedName || undefined,
    mockDataPayload: parsed.fields,
    ocrExtractedText: rawOcr,
  };
}

/**
 * Creates a suite of sample verification documents with intentional discrepancies for testing.
 */
export function createDiscrepantSampleVerificationDocs(
  app: StudentApplication
): Record<string, UploadedDocItem> {
  const dateStr = new Date().toISOString().split('T')[0];

  const aadhaarPayload = createDefaultOcrPayloadForDoc('aadhaarCard', app, true);
  const tenthPayload = createDefaultOcrPayloadForDoc('tenthMarksheet', app, true);
  const tenthTcPayload = createDefaultOcrPayloadForDoc('tenthTc', app, false);
  const twelfthPayload = createDefaultOcrPayloadForDoc('twelfthMarksheet', app, true);
  const twelfthTcPayload = createDefaultOcrPayloadForDoc('twelfthTc', app, false);
  const commPayload = createDefaultOcrPayloadForDoc('communityCert', app, true);
  const incPayload = createDefaultOcrPayloadForDoc('incomeCert', app, false);
  const birthPayload = createDefaultOcrPayloadForDoc('birthCert', app, false);

  return {
    aadhaarCard: {
      id: `doc-aadh-disc-${Date.now()}`,
      name: 'Aadhaar_Identification.pdf',
      type: 'application/pdf',
      fileSize: '1.24 MB',
      uploadDate: dateStr,
      extractedName: 'Karthick Ramanathan',
      mockDataPayload: aadhaarPayload,
      ocrExtractedText: generateRawOcrText('aadhaarCard', aadhaarPayload),
    },
    tenthMarksheet: {
      id: `doc-10th-disc-${Date.now()}`,
      name: '10th_Standard_SSLC_Marksheet.pdf',
      type: 'application/pdf',
      fileSize: '1.85 MB',
      uploadDate: dateStr,
      extractedName: 'R. Karthik',
      mockDataPayload: tenthPayload,
      ocrExtractedText: generateRawOcrText('tenthMarksheet', tenthPayload),
    },
    tenthTc: {
      id: `doc-10tc-${Date.now()}`,
      name: '10th_Transfer_Certificate.pdf',
      type: 'application/pdf',
      fileSize: '920 KB',
      uploadDate: dateStr,
      mockDataPayload: tenthTcPayload,
      ocrExtractedText: generateRawOcrText('tenthTc', tenthTcPayload),
    },
    twelfthMarksheet: {
      id: `doc-12th-disc-${Date.now()}`,
      name: '12th_HSC_Marksheet.pdf',
      type: 'application/pdf',
      fileSize: '2.10 MB',
      uploadDate: dateStr,
      extractedName: 'R. Karthik',
      mockDataPayload: twelfthPayload,
      ocrExtractedText: generateRawOcrText('twelfthMarksheet', twelfthPayload),
    },
    twelfthTc: {
      id: `doc-12tc-${Date.now()}`,
      name: '12th_Transfer_Certificate.pdf',
      type: 'application/pdf',
      fileSize: '840 KB',
      uploadDate: dateStr,
      mockDataPayload: twelfthTcPayload,
      ocrExtractedText: generateRawOcrText('twelfthTc', twelfthTcPayload),
    },
    communityCert: {
      id: `doc-comm-disc-${Date.now()}`,
      name: 'Community_Certificate.pdf',
      type: 'application/pdf',
      fileSize: '890 KB',
      uploadDate: dateStr,
      mockDataPayload: commPayload,
      ocrExtractedText: generateRawOcrText('communityCert', commPayload),
    },
    incomeCert: {
      id: `doc-inc-${Date.now()}`,
      name: 'Income_Certificate_2026.pdf',
      type: 'application/pdf',
      fileSize: '740 KB',
      uploadDate: dateStr,
      mockDataPayload: incPayload,
      ocrExtractedText: generateRawOcrText('incomeCert', incPayload),
    },
    birthCert: {
      id: `doc-birth-${Date.now()}`,
      name: 'Birth_Certificate_Municipal.pdf',
      type: 'application/pdf',
      fileSize: '650 KB',
      uploadDate: dateStr,
      mockDataPayload: birthPayload,
      ocrExtractedText: generateRawOcrText('birthCert', birthPayload),
    },
    photo: {
      id: `doc-photo-${Date.now()}`,
      name: 'Candidate_Passport_Photograph.jpg',
      type: 'image/jpeg',
      fileSize: '320 KB',
      uploadDate: dateStr,
      mockDataPayload: {
        dimensions: '3.5 x 4.5 cm',
        background: 'Clean White Neutral',
      },
    },
  };
}
