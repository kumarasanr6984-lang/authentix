import { jsPDF } from 'jspdf';
import * as zlib from 'zlib';

function createSamplePdf(candidateName: string): Uint8Array {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('GOVERNMENT OF TAMIL NADU', 20, 20);
  doc.setFontSize(14);
  doc.text('DIRECTORATE OF GOVERNMENT EXAMINATIONS', 20, 30);
  doc.setFontSize(12);
  doc.text('HIGHER SECONDARY COURSE CERTIFICATE', 20, 40);
  doc.text(`Candidate Name: ${candidateName}`, 20, 55);
  doc.text('DOB: 14/05/2007', 20, 65);
  doc.text('Register No: TN-HSC-789104', 20, 75);
  doc.text('Mathematics: 95', 20, 85);
  doc.text('Physics: 92', 20, 95);
  doc.text('Chemistry: 90', 20, 105);
  doc.text('Total Marks: 554 / 600', 20, 115);
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

// Function to extract text from raw PDF buffer without external dependencies
export function extractTextFromPdfRaw(data: Uint8Array): string {
  const binaryString = Buffer.from(data).toString('latin1');
  const texts: string[] = [];

  // 1. Search for uncompressed streams or direct string literals
  // PDF string literals are in parentheses: (Text here)
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binaryString)) !== null) {
    const rawStream = match[1];
    // Check if it's compressed or plain
    let decodedText = '';
    try {
      const buffer = Buffer.from(rawStream, 'latin1');
      const decompressed = zlib.inflateSync(buffer);
      decodedText = decompressed.toString('utf-8');
    } catch {
      // If inflate fails, might already be plain text
      decodedText = rawStream;
    }

    if (decodedText) {
      // Extract strings from Tj / TJ operators: (text) Tj or [(t) 10 (e)] TJ
      const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(decodedText)) !== null) {
        texts.push(tjMatch[1]);
      }

      // Also array format: [ (part1) -10 (part2) ] TJ
      const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
      let arrayMatch: RegExpExecArray | null;
      while ((arrayMatch = tjArrayRegex.exec(decodedText)) !== null) {
        const innerStrings = arrayMatch[1].match(/\(([^)]+)\)/g);
        if (innerStrings) {
          const joined = innerStrings.map(s => s.slice(1, -1)).join('');
          texts.push(joined);
        }
      }
    }
  }

  // Fallback: If no streams produced text, search for (Candidate Name: ...) directly in binary string
  if (texts.length === 0) {
    const directRegex = /\(([A-Za-z0-9\s:,\.\-\/]{3,100})\)/g;
    let directMatch: RegExpExecArray | null;
    while ((directMatch = directRegex.exec(binaryString)) !== null) {
      texts.push(directMatch[1]);
    }
  }

  return texts.join('\n');
}

const pdfData = createSamplePdf('Karthik Ramanathan');
const extracted = extractTextFromPdfRaw(pdfData);
console.log('--- EXTRACTED TEXT FROM PDF BYTES ---');
console.log(extracted);
console.log('-------------------------------------');
