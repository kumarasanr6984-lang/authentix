/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentApplication, UploadedDocItem } from '../types/admissions';
import { extractDocumentName } from './nameVerificationService';

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
  for (const [k, v] of Object.entries(payload)) {
    lines.push(`TOKEN_${k.toUpperCase()}: "${v}"`);
  }
  lines.push('----------------------------------------');
  lines.push('CHECKSUM: SHA-256 VALIDATED');
  return lines.join('\n');
}

/**
 * Processes an uploaded file (image or PDF) and synthesizes realistic OCR extracted data.
 */
export async function processUploadedFileWithOcr(
  file: File,
  slotKey: string,
  app: StudentApplication
): Promise<UploadedDocItem> {
  const isImg = file.type.startsWith('image/');
  const previewUrl = isImg ? URL.createObjectURL(file) : undefined;
  const filenameExtracted = extractDocumentName({ name: file.name });

  // Generate structured OCR payload for this document type
  const payload = createDefaultOcrPayloadForDoc(slotKey, app, false);

  // If filename contained a specific name, use it in the OCR payload
  if (filenameExtracted.extractedName) {
    if ('name' in payload) payload.name = filenameExtracted.extractedName;
    if ('studentName' in payload) payload.studentName = filenameExtracted.extractedName;
    if ('childName' in payload) payload.childName = filenameExtracted.extractedName;
  }

  const rawOcr = generateRawOcrText(slotKey, payload);

  const docName =
    (payload.name as string) ||
    (payload.studentName as string) ||
    (payload.childName as string) ||
    filenameExtracted.extractedName ||
    app.personal.fullName;

  return {
    id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: file.name,
    type: file.type || 'application/pdf',
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    uploadDate: new Date().toISOString().split('T')[0],
    previewUrl,
    extractedName: docName,
    mockDataPayload: payload,
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
      name: 'Aadhaar_Karthick_Ramanathan_Discrepant.pdf',
      type: 'application/pdf',
      fileSize: '1.24 MB',
      uploadDate: dateStr,
      extractedName: 'Karthick Ramanathan',
      mockDataPayload: aadhaarPayload,
      ocrExtractedText: generateRawOcrText('aadhaarCard', aadhaarPayload),
    },
    tenthMarksheet: {
      id: `doc-10th-disc-${Date.now()}`,
      name: '10th_Standard_SSLC_Marksheet_Discrepant.pdf',
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
      name: '12th_HSC_Marksheet_Discrepant.pdf',
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
      name: 'Community_Certificate_MBC_Discrepant.pdf',
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
