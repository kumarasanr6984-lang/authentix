import { jsPDF } from 'jspdf';
import { extractDocumentName, extractCandidateNameFromText } from '../src/services/nameVerificationService';
import { extractTextFromPdf, parseFieldsFromInDocText } from '../src/services/ocrExtractionService';
import { runDocumentVerificationPipeline } from '../src/services/verificationEngine';
import { StudentApplication } from '../src/types/admissions';
import { createBlankApplication } from '../src/services/storage';

// Helper to create a PDF buffer containing specified text lines
function generateTestPdf(lines: string[]): ArrayBuffer {
  const doc = new jsPDF();
  doc.setFontSize(14);
  let y = 20;
  for (const line of lines) {
    doc.text(line, 20, y);
    y += 10;
  }
  return doc.output('arraybuffer');
}

async function runTests() {
  console.log('=== STARTING IN-DOCUMENT OCR VERIFICATION TESTS ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  // TEST 1: Filename contains applicant name "Karthik_Ramanathan.pdf", but inside PDF text is "Candidate Name: Suresh Kumar"
  const pdfBufferMismatch = generateTestPdf([
    'GOVERNMENT OF TAMIL NADU',
    'DEPARTMENT OF SCHOOL EDUCATION',
    'HIGHER SECONDARY COURSE CERTIFICATE',
    'Candidate Name: Suresh Kumar',
    'DOB: 14/05/2007',
    'Register No: TN-HSC-789104',
    'Mathematics: 95',
    'Physics: 92',
    'Chemistry: 90',
  ]);

  const extractedTextMismatch = await extractTextFromPdf(pdfBufferMismatch);
  const parsedMismatch = parseFieldsFromInDocText(extractedTextMismatch, 'twelfthMarksheet');

  assert(
    parsedMismatch.extractedName === 'Suresh Kumar',
    'In-document extraction extracts "Suresh Kumar" from PDF text, ignoring filename',
    `Extracted name was "${parsedMismatch.extractedName}"`
  );

  // Now create mock document with filename "Karthik_Ramanathan.pdf" but payload/OCR from inside document
  const docMismatch = {
    id: 'test-doc-1',
    name: 'Karthik_Ramanathan.pdf', // NOTE: Filename contains Karthik Ramanathan!
    type: 'application/pdf',
    fileSize: '1.2 MB',
    uploadDate: '2026-10-29',
    ocrExtractedText: extractedTextMismatch,
    extractedName: parsedMismatch.extractedName || undefined,
    mockDataPayload: parsedMismatch.fields,
  };

  const nameVerdictMismatch = extractDocumentName(docMismatch);
  assert(
    nameVerdictMismatch.extractedName === 'Suresh Kumar',
    'extractDocumentName returns "Suresh Kumar" and strictly ignores filename "Karthik_Ramanathan.pdf"',
    `Got: "${nameVerdictMismatch.extractedName}"`
  );

  // Test full application verification against candidate "Karthik Ramanathan"
  const app1: StudentApplication = createBlankApplication('1001', 'Coimbatore Institute of Technology');
  app1.personal.fullName = 'Karthik Ramanathan';
  app1.documents.twelfthMarksheet = docMismatch;

  const report1 = runDocumentVerificationPipeline(app1);
  const hscDocReport = report1.documentsReport.find((d) => d.documentId === 'twelfthMarksheet');
  const hscNameField = hscDocReport?.fields.find((f) => f.fieldName.includes('Candidate Name'));

  assert(
    hscDocReport?.status === 'red' || hscNameField?.matchResult === 'MISMATCH',
    'Verification engine marks HSC document as MISMATCH due to in-document name discrepancy',
    `Status: ${hscDocReport?.status}, Name matchResult: ${hscNameField?.matchResult}, Reason: ${hscNameField?.reason}`
  );

  // TEST 2: Arbitrary filename "scan_random_99988.pdf", but inside PDF text is "Candidate Name: Karthik Ramanathan"
  const pdfBufferMatch = generateTestPdf([
    'GOVERNMENT OF TAMIL NADU',
    'DEPARTMENT OF SCHOOL EDUCATION',
    'HIGHER SECONDARY COURSE CERTIFICATE',
    'Candidate Name: Karthik Ramanathan',
    'DOB: 14/05/2007',
    'Register No: TN-HSC-789104',
    'Mathematics: 95',
    'Physics: 92',
    'Chemistry: 90',
  ]);

  const extractedTextMatch = await extractTextFromPdf(pdfBufferMatch);
  const parsedMatch = parseFieldsFromInDocText(extractedTextMatch, 'twelfthMarksheet');

  assert(
    parsedMatch.extractedName === 'Karthik Ramanathan',
    'In-document extraction extracts "Karthik Ramanathan" from PDF text with random filename',
    `Extracted: "${parsedMatch.extractedName}"`
  );

  const docMatch = {
    id: 'test-doc-2',
    name: 'scan_random_99988.pdf', // Random filename
    type: 'application/pdf',
    fileSize: '1.2 MB',
    uploadDate: '2026-10-29',
    ocrExtractedText: extractedTextMatch,
    extractedName: parsedMatch.extractedName || undefined,
    mockDataPayload: parsedMatch.fields,
  };

  const nameVerdictMatch = extractDocumentName(docMatch);
  assert(
    nameVerdictMatch.extractedName === 'Karthik Ramanathan',
    'extractDocumentName returns "Karthik Ramanathan" for random filename',
    `Got: "${nameVerdictMatch.extractedName}"`
  );

  const app2: StudentApplication = createBlankApplication('1001', 'Coimbatore Institute of Technology');
  app2.personal.fullName = 'Karthik Ramanathan';
  app2.twelfth.registerNumber = 'TN-HSC-789104';
  app2.twelfth.mathsMarks = 95;
  app2.twelfth.physicsMarks = 92;
  app2.twelfth.chemistryMarks = 90;
  app2.twelfth.engineeringCutoff = 186.0; // 95 + 46 + 45 = 186.0
  app2.documents.twelfthMarksheet = docMatch;

  const report2 = runDocumentVerificationPipeline(app2);
  const hscDocReport2 = report2.documentsReport.find((d) => d.documentId === 'twelfthMarksheet');
  const hscNameField2 = hscDocReport2?.fields.find((f) => f.fieldName.includes('Candidate Name'));

  if (hscDocReport2?.status !== 'green') {
    console.log('HSC fields debug:', JSON.stringify(hscDocReport2?.fields, null, 2));
  }

  assert(
    hscDocReport2?.status === 'green' && hscNameField2?.matchResult === 'MATCH',
    'Verification engine marks HSC document as MATCH when in-document content tallies with form',
    `Status: ${hscDocReport2?.status}, Name match: ${hscNameField2?.matchResult}`
  );

  // TEST 3: Blank / unreadable PDF named "Karthik_Ramanathan.pdf" (should NOT verify via filename)
  const pdfBufferBlank = generateTestPdf([
    'This is a random receipt or blank document without student credentials.',
    'Invoice Number: #99218',
    'Amount: INR 500',
  ]);

  const extractedBlankText = await extractTextFromPdf(pdfBufferBlank);
  const parsedBlank = parseFieldsFromInDocText(extractedBlankText, 'twelfthMarksheet');

  assert(
    parsedBlank.extractedName === null,
    'Blank or receipt PDF yields null extractedName',
    `Got: "${parsedBlank.extractedName}"`
  );

  const docBlank = {
    id: 'test-doc-3',
    name: 'Karthik_Ramanathan.pdf', // NOTE: Even though filename has applicant name!
    type: 'application/pdf',
    fileSize: '800 KB',
    uploadDate: '2026-10-29',
    ocrExtractedText: extractedBlankText,
  };

  const nameVerdictBlank = extractDocumentName(docBlank);
  assert(
    nameVerdictBlank.extractedName === null && nameVerdictBlank.quality === 'UNREADABLE',
    'extractDocumentName returns UNREADABLE null for document without in-doc candidate name',
    `Got quality: ${nameVerdictBlank.quality}, name: ${nameVerdictBlank.extractedName}`
  );

  // TEST 4: Various Indian Document Text Layouts
  // Pattern 1: Transfer Certificate "This is to certify that Selvan ..."
  const tcText = 'This is to certify that Selvan Rajesh Kumar son of Sundaram has passed the examination.';
  const tcName = extractCandidateNameFromText(tcText);
  assert(tcName === 'Rajesh Kumar', 'Certify pattern extracts "Rajesh Kumar"', `Got: "${tcName}"`);

  // Pattern 2: Aadhaar Card structure (line right before "DOB:")
  const aadhaarText = 'Government of India\nUnique Identification Authority of India\nPriya Narayanan\nDOB: 22/08/2006\nFemale\n9182 3412 8790';
  const aadhaarName = extractCandidateNameFromText(aadhaarText);
  assert(aadhaarName === 'Priya Narayanan', 'Aadhaar line before DOB extracts "Priya Narayanan"', `Got: "${aadhaarName}"`);

  // Pattern 3: Institutional header rejection (must NOT extract "GOVERNMENT OF TAMIL NADU" as candidate name)
  const headerText = 'GOVERNMENT OF TAMIL NADU\nDIRECTORATE OF GOVERNMENT EXAMINATIONS\nSTATEMENT OF MARKS';
  const headerName = extractCandidateNameFromText(headerText);
  assert(headerName === null, 'Institutional header rejection correctly returns null', `Got: "${headerName}"`);

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} / ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
