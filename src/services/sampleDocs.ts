/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UploadedDocItem, StudentApplication } from '../types/admissions';

export function createSampleVerificationDocs(app: StudentApplication): Record<string, UploadedDocItem> {
  const dateStr = new Date().toISOString().split('T')[0];

  return {
    aadhaarCard: {
      id: `doc-aadh-${Date.now()}`,
      name: `Aadhaar_${app.personal.fullName.replace(/\s+/g, '_')}.pdf`,
      type: 'application/pdf',
      fileSize: '1.24 MB',
      uploadDate: dateStr,
      mockDataPayload: {
        name: app.personal.fullName,
        dob: app.personal.dob,
        aadhaarNumber: app.certificates.aadhaarNumber || '9845 2210 9812',
        gender: app.personal.gender || 'Male',
      },
    },
    communityCert: {
      id: `doc-comm-${Date.now()}`,
      name: `Community_Cert_${app.specialCategory.community.replace(/[^a-zA-Z]/g, '')}.pdf`,
      type: 'application/pdf',
      fileSize: '890 KB',
      uploadDate: dateStr,
      mockDataPayload: {
        category: app.specialCategory.community,
        certNumber: app.certificates.communityCertNumber || 'TN-COMM-2024-99812',
        issuingAuthority: 'Zonal Deputy Tahsildar, Revenue Department',
      },
    },
    incomeCert: {
      id: `doc-inc-${Date.now()}`,
      name: 'Income_Certificate_2026.pdf',
      type: 'application/pdf',
      fileSize: '740 KB',
      uploadDate: dateStr,
      mockDataPayload: {
        certNumber: app.certificates.incomeCertNumber || 'TN-INC-2024-88912',
        annualIncome: '₹ 1,80,000 / annum',
      },
    },
    tenthMarksheet: {
      id: `doc-10th-${Date.now()}`,
      name: '10th_Standard_SSLC_Marksheet.pdf',
      type: 'application/pdf',
      fileSize: '1.85 MB',
      uploadDate: dateStr,
      mockDataPayload: {
        studentName: app.personal.fullName,
        registerNumber: app.tenth.registerNumber || 'TN-SSLC-489201',
        schoolName: app.tenth.schoolName || 'Stanes Higher Secondary School',
        totalMarks: app.tenth.totalMarks || 486,
        marksheetNumber: app.tenth.marksheetNumber || 'SSLC-2024-99812',
      },
    },
    tenthTc: {
      id: `doc-10tc-${Date.now()}`,
      name: '10th_Transfer_Certificate.pdf',
      type: 'application/pdf',
      fileSize: '920 KB',
      uploadDate: dateStr,
      mockDataPayload: {
        schoolName: app.tenth.schoolName || 'Stanes Higher Secondary School',
        tcNumber: app.tenth.tcNumber || 'TC-STANES-0841',
      },
    },
    twelfthMarksheet: {
      id: `doc-12th-${Date.now()}`,
      name: '12th_HSC_Marksheet.pdf',
      type: 'application/pdf',
      fileSize: '2.10 MB',
      uploadDate: dateStr,
      mockDataPayload: {
        studentName: app.personal.fullName,
        registerNumber: app.twelfth.registerNumber || 'TN-HSC-789104',
        mathsMarks: app.twelfth.mathsMarks || 95,
        physicsMarks: app.twelfth.physicsMarks || 92,
        chemistryMarks: app.twelfth.chemistryMarks || 90,
      },
    },
    twelfthTc: {
      id: `doc-12tc-${Date.now()}`,
      name: '12th_Transfer_Certificate.pdf',
      type: 'application/pdf',
      fileSize: '840 KB',
      uploadDate: dateStr,
    },
    birthCert: {
      id: `doc-birth-${Date.now()}`,
      name: 'Birth_Certificate_Municipal.pdf',
      type: 'application/pdf',
      fileSize: '650 KB',
      uploadDate: dateStr,
    },
    photo: {
      id: `doc-photo-${Date.now()}`,
      name: 'Candidate_Passport_Photograph.jpg',
      type: 'image/jpeg',
      fileSize: '320 KB',
      uploadDate: dateStr,
    },
  };
}
