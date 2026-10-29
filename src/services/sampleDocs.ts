/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UploadedDocItem, StudentApplication } from '../types/admissions';
import { generateRawOcrText } from './ocrExtractionService';

export function createSampleVerificationDocs(app: StudentApplication): Record<string, UploadedDocItem> {
  const dateStr = new Date().toISOString().split('T')[0];

  const aadhaarPayload = {
    name: app.personal.fullName,
    dob: app.personal.dob,
    aadhaarNumber: app.certificates.aadhaarNumber || '9845 2210 9812',
    gender: app.personal.gender || 'Male',
  };

  const tenthPayload = {
    studentName: app.personal.fullName,
    registerNumber: app.tenth.registerNumber || 'TN-SSLC-489201',
    schoolName: app.tenth.schoolName || 'Stanes Higher Secondary School',
    totalMarks: app.tenth.totalMarks || 486,
    marksheetNumber: app.tenth.marksheetNumber || 'SSLC-2024-99812',
  };

  const tenthTcPayload = {
    schoolName: app.tenth.schoolName || 'Stanes Higher Secondary School',
    tcNumber: app.tenth.tcNumber || 'TC-STANES-0841',
  };

  const twelfthPayload = {
    studentName: app.personal.fullName,
    registerNumber: app.twelfth.registerNumber || 'TN-HSC-789104',
    mathsMarks: app.twelfth.mathsMarks || 95,
    physicsMarks: app.twelfth.physicsMarks || 92,
    chemistryMarks: app.twelfth.chemistryMarks || 90,
  };

  const twelfthTcPayload = {
    schoolName: app.twelfth.schoolName || 'Stanes Higher Secondary School',
    tcNumber: app.twelfth.tcNumber || 'TC-STANES-1204',
  };

  const commPayload = {
    category: app.specialCategory.community,
    certNumber: app.certificates.communityCertNumber || 'TN-COMM-2024-99812',
    issuingAuthority: 'Zonal Deputy Tahsildar, Revenue Department',
  };

  const incomePayload = {
    certNumber: app.certificates.incomeCertNumber || 'TN-INC-2024-88912',
    annualIncome: '₹ 1,80,000 / annum',
  };

  const birthPayload = {
    childName: app.personal.fullName,
    dob: app.personal.dob,
    registrationNumber: app.certificates.birthCertNumber || 'TN-MC-2007-00918',
    fatherName: app.personal.fatherName || 'Ramanathan Krishnan',
    motherName: app.personal.motherName || 'Lakshmi Ramanathan',
  };

  return {
    aadhaarCard: {
      id: `doc-aadh-${Date.now()}`,
      name: 'Aadhaar_UIDAI_Document.pdf',
      type: 'application/pdf',
      fileSize: '1.24 MB',
      uploadDate: dateStr,
      extractedName: app.personal.fullName,
      mockDataPayload: aadhaarPayload,
      ocrExtractedText: generateRawOcrText('aadhaarCard', aadhaarPayload),
    },
    communityCert: {
      id: `doc-comm-${Date.now()}`,
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
      mockDataPayload: incomePayload,
      ocrExtractedText: generateRawOcrText('incomeCert', incomePayload),
    },
    tenthMarksheet: {
      id: `doc-10th-${Date.now()}`,
      name: '10th_Standard_SSLC_Marksheet.pdf',
      type: 'application/pdf',
      fileSize: '1.85 MB',
      uploadDate: dateStr,
      extractedName: app.personal.fullName,
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
      id: `doc-12th-${Date.now()}`,
      name: '12th_HSC_Marksheet.pdf',
      type: 'application/pdf',
      fileSize: '2.10 MB',
      uploadDate: dateStr,
      extractedName: app.personal.fullName,
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
    birthCert: {
      id: `doc-birth-${Date.now()}`,
      name: 'Birth_Certificate_Municipal.pdf',
      type: 'application/pdf',
      fileSize: '650 KB',
      uploadDate: dateStr,
      extractedName: app.personal.fullName,
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
