/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NameVerificationVerdict =
  | 'VERIFIED'
  | 'POSSIBLE_MATCH_MANUAL_REVIEW'
  | 'NAME_MISMATCH'
  | 'UNABLE_TO_VERIFY';

export type NameMatchType =
  | 'EXACT_MATCH'
  | 'TOKEN_REARRANGEMENT'
  | 'INITIAL_MATCH'
  | 'EXPANDED_INITIAL'
  | 'MINOR_SPELLING_VARIATION'
  | 'PHONETIC_TRANSLITERATION'
  | 'SUBSTANTIAL_MISMATCH'
  | 'EXTRACTION_FAILED';

export interface NameVerificationDetails {
  editDistance?: number;
  normalizedDistance?: number;
  tokenSimilarity?: number;
  phoneticEquivalence?: boolean;
  initialsAligned?: boolean;
  notes?: string[];
}

export interface NameVerificationResult {
  verdict: NameVerificationVerdict;
  verdictLabel: string;
  confidence: number | null;
  formName: string;
  documentName: string;
  normalizedFormName: string;
  normalizedDocName: string;
  differenceExplanation: string;
  recommendedAction: string;
  matchType: NameMatchType;
  details: NameVerificationDetails;
}

// Configurable thresholds for fuzzy name verification
export interface NameVerificationConfig {
  verifiedThreshold: number; // default: 90
  manualReviewThreshold: number; // default: 65
}

export const DEFAULT_NAME_CONFIG: NameVerificationConfig = {
  verifiedThreshold: 90,
  manualReviewThreshold: 65,
};

/**
 * Normalizes a personal name:
 * - Trims and converts to lower-case
 * - Strips common formal honorifics/prefixes (Mr, Ms, Selvan, Selvi, Shri, Dr, Master, etc.)
 * - Replaces punctuation (dots, commas, hyphens, slashes) with spaces
 * - Collapses repeated whitespace
 */
export function normalizeName(name: string): string {
  if (!name) return '';

  let cleaned = name.trim().toLowerCase();

  // Strip formal honorifics
  cleaned = cleaned.replace(/\b(mr|ms|mrs|dr|master|selvan|selvi|shri|sri|smt|kumari)\b\.?/gi, ' ');

  // Replace punctuation with spaces
  cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]]/g, ' ');

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Phonetic/transliteration normalization for common Indian & regional name variations:
 * - 'ow' <-> 'ou' (Gowtham vs Goutham)
 * - 'v' <-> 'w' (Wijay vs Vijay, Ramaswamy vs Ramasamy)
 * - 'ee' <-> 'i' (Sreenath vs Srinath, Deepika vs Dipika)
 * - 'oo' <-> 'u' (Pooja vs Puja)
 * - 'th' <-> 't' (Karthik vs Kartik)
 * - 'ksh' <-> 'x' (Lakshmi vs Laxmi)
 * - 'dh' <-> 'd' (Sridhar vs Sridar)
 * - 'bh' <-> 'b'
 * - 'ph' <-> 'f'
 * - 'kh' <-> 'k'
 * - 'gh' <-> 'g'
 * - double consonants collapse (Karthick vs Karthik, Mohammed vs Mohamed)
 */
export function phoneticTransliterate(name: string): string {
  let s = normalizeName(name);
  if (!s) return '';

  s = s.replace(/ou/g, 'ow');
  s = s.replace(/w/g, 'v');
  s = s.replace(/ee/g, 'i');
  s = s.replace(/oo/g, 'u');
  s = s.replace(/ksh/g, 'x');
  s = s.replace(/th/g, 't');
  s = s.replace(/sh/g, 's');
  s = s.replace(/ck/g, 'k');
  s = s.replace(/dh/g, 'd');
  s = s.replace(/bh/g, 'b');
  s = s.replace(/ph/g, 'f');
  s = s.replace(/kh/g, 'k');
  s = s.replace(/gh/g, 'g');

  // Collapse duplicate letters: e.g. "mm" -> "m", "tt" -> "t", "ll" -> "l"
  s = s.replace(/(.)\1+/g, '$1');

  return s;
}

/**
 * Standard Levenshtein Distance
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Jaro-Winkler Similarity Metric (0.0 to 1.0)
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }
  const transpositions = t / 2;

  const jaro =
    (matches / s1.length + matches / s2.length + (matches - transpositions) / matches) / 3.0;

  // Winkler prefix boost up to 4 chars
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Fuzzy string similarity score (0 to 100) using normalized Levenshtein & Jaro-Winkler
 */
export function computeSimilarityScore(str1: string, str2: string): number {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  if (!s1 && !s2) return 100;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 100;

  // Sorted token match check
  const tok1 = getTokens(s1).sort().join('');
  const tok2 = getTokens(s2).sort().join('');
  if (tok1 === tok2 && tok1.length > 0) return 98;

  const jw = jaroWinklerSimilarity(s1, s2);
  const levDist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  const lev = maxLen > 0 ? (1 - levDist / maxLen) : 1;

  const score = Math.round((jw * 0.6 + lev * 0.4) * 100);
  return Math.min(100, Math.max(0, score));
}

/**
 * Tokenize string into non-empty tokens
 */
function getTokens(str: string): string[] {
  return normalizeName(str).split(' ').filter(Boolean);
}

/**
 * Advanced token matching algorithm that handles:
 * - Equal lengths: e.g. ['r', 'kumar'] vs ['ramanathan', 'kumar']
 * - Unequal lengths: e.g. ['deepika', 'senthil', 'kumar'] vs ['deepika', 's']
 * - Abbreviated names & omitted initials
 */
function checkComplexInitialAndTokenAlignment(
  tokens1: string[],
  tokens2: string[]
): {
  isMatch: boolean;
  matchType: NameMatchType;
  confidence: number;
  explanation: string;
} {
  if (tokens1.length === 0 || tokens2.length === 0) {
    return { isMatch: false, matchType: 'SUBSTANTIAL_MISMATCH', confidence: 0, explanation: '' };
  }

  // 1. Equal token count with expanded initial:
  // e.g. ['r', 'kumar'] vs ['ramanathan', 'kumar']
  if (tokens1.length === tokens2.length) {
    const sorted1 = [...tokens1].sort();
    const sorted2 = [...tokens2].sort();

    let initialCount = 0;
    let exactCount = 0;
    let initialDesc = '';

    for (let i = 0; i < sorted1.length; i++) {
      const t1 = sorted1[i];
      const t2 = sorted2[i];
      if (t1 === t2) {
        exactCount++;
      } else if (t1.length === 1 && t2.length > 1 && t2.startsWith(t1)) {
        initialCount++;
        initialDesc = `Initial '${t1.toUpperCase()}' expands to '${t2}'`;
      } else if (t2.length === 1 && t1.length > 1 && t1.startsWith(t2)) {
        initialCount++;
        initialDesc = `Initial '${t2.toUpperCase()}' expands to '${t1}'`;
      }
    }

    if (exactCount + initialCount === sorted1.length && initialCount > 0) {
      return {
        isMatch: true,
        matchType: 'EXPANDED_INITIAL',
        confidence: 88,
        explanation: `Abbreviated initial matches expanded name on record (${initialDesc}). Common regional patronymic variation.`,
      };
    }
  }

  // 2. Unequal token lengths: e.g. ['deepika', 'senthil', 'kumar'] vs ['deepika', 's']
  // or ['karthik', 'ramanathan'] vs ['karthik']
  const longer = tokens1.length >= tokens2.length ? tokens1 : tokens2;
  const shorter = tokens1.length < tokens2.length ? tokens1 : tokens2;

  // Check how many shorter tokens match longer tokens exactly or as initials
  let matchedShorterCount = 0;
  const matchNotes: string[] = [];
  const usedLongerIndices = new Set<number>();

  for (const sTok of shorter) {
    // Try exact word match first
    let foundExact = false;
    for (let j = 0; j < longer.length; j++) {
      if (!usedLongerIndices.has(j) && longer[j] === sTok) {
        usedLongerIndices.add(j);
        matchedShorterCount++;
        foundExact = true;
        break;
      }
    }
    if (!foundExact) {
      // Try initial match
      for (let j = 0; j < longer.length; j++) {
        if (!usedLongerIndices.has(j)) {
          const lTok = longer[j];
          if (sTok.length === 1 && lTok.startsWith(sTok)) {
            usedLongerIndices.add(j);
            matchedShorterCount++;
            matchNotes.push(`Initial '${sTok.toUpperCase()}' matches '${lTok}'`);
            break;
          } else if (lTok.length === 1 && sTok.startsWith(lTok)) {
            usedLongerIndices.add(j);
            matchedShorterCount++;
            matchNotes.push(`Initial '${lTok.toUpperCase()}' matches '${sTok}'`);
            break;
          }
        }
      }
    }
  }

  // If every token in the shorter name was matched into the longer name:
  if (matchedShorterCount === shorter.length && shorter.length >= 1) {
    const unmatchedCount = longer.length - shorter.length;
    // e.g. ['deepika', 's'] vs ['deepika', 'senthil', 'kumar']
    if (unmatchedCount <= 2) {
      const isInitialVariant = shorter.some((t) => t.length === 1) || longer.some((t) => t.length === 1);
      return {
        isMatch: true,
        matchType: isInitialVariant ? 'EXPANDED_INITIAL' : 'INITIAL_MATCH',
        confidence: isInitialVariant ? 85 : 80,
        explanation: matchNotes.length > 0
          ? `Core tokens align (${matchNotes.join(', ')}). One record includes additional patronymic or family names.`
          : 'Core name matches exactly; additional middle or surname tokens present in the document record.',
      };
    }
  }

  return { isMatch: false, matchType: 'SUBSTANTIAL_MISMATCH', confidence: 0, explanation: '' };
}

/**
 * Core Name Verification Engine
 * Compares Form Name against Document Extracted Name and returns explainable result.
 */
export function verifyStudentName(
  formNameRaw: string,
  docNameRaw: string,
  documentType: string = 'Document',
  config: NameVerificationConfig = DEFAULT_NAME_CONFIG
): NameVerificationResult {
  const formName = (formNameRaw || '').trim();
  const docName = (docNameRaw || '').trim();

  // 1. Check for missing or unreadable document name
  if (
    !docName ||
    docName.toUpperCase() === 'UNREADABLE' ||
    docName.toUpperCase() === 'UNKNOWN' ||
    docName === '[OCR FAILED]' ||
    docName === '— (No text extracted)'
  ) {
    return {
      verdict: 'UNABLE_TO_VERIFY',
      verdictLabel: 'Unable to Verify',
      confidence: null,
      formName,
      documentName: docName || '— (No text extracted)',
      normalizedFormName: normalizeName(formName),
      normalizedDocName: '',
      differenceExplanation: `The candidate name could not be extracted from ${documentType} due to missing text, low resolution, or occlusion.`,
      recommendedAction: 'Inspect the document preview manually or request a clearer image upload from the student.',
      matchType: 'EXTRACTION_FAILED',
      details: {
        notes: ['Document name is empty or OCR extraction returned no viable tokens.'],
      },
    };
  }

  if (!formName) {
    return {
      verdict: 'UNABLE_TO_VERIFY',
      verdictLabel: 'Unable to Verify',
      confidence: null,
      formName: '— (Empty in form)',
      documentName: docName,
      normalizedFormName: '',
      normalizedDocName: normalizeName(docName),
      differenceExplanation: 'Application form candidate full name is blank.',
      recommendedAction: 'Complete Section A Personal Information in the admission form.',
      matchType: 'EXTRACTION_FAILED',
      details: {
        notes: ['Application form name is empty.'],
      },
    };
  }

  const normForm = normalizeName(formName);
  const normDoc = normalizeName(docName);

  // 2. Exact match after standard normalization
  // Example 2: Gowtham Raj vs Gowtham Raj
  if (normForm === normDoc) {
    return {
      verdict: 'VERIFIED',
      verdictLabel: 'Verified',
      confidence: 100,
      formName,
      documentName: docName,
      normalizedFormName: normForm,
      normalizedDocName: normDoc,
      differenceExplanation: 'Full name matches exactly with document records.',
      recommendedAction: 'Automated verification pass confirmed.',
      matchType: 'EXACT_MATCH',
      details: {
        editDistance: 0,
        tokenSimilarity: 100,
        notes: ['Characters, casing, and token arrangement match perfectly.'],
      },
    };
  }

  const tokensForm = getTokens(normForm);
  const tokensDoc = getTokens(normDoc);

  // 3. Token Sort Match: Reversed order or rearranged tokens
  // Example 1: R. Kumar vs Kumar R (both sorted = "kumar r")
  // Example 8: Kumar Raj vs Raj Kumar (both sorted = "kumar raj")
  const sortedForm = [...tokensForm].sort().join(' ');
  const sortedDoc = [...tokensDoc].sort().join(' ');

  if (sortedForm === sortedDoc && sortedForm.length > 0) {
    const hasInitial = tokensForm.some((t) => t.length === 1);
    const confidence = hasInitial ? 96 : 98;
    const isReversedOrder = tokensForm.length > 1;

    return {
      verdict: 'VERIFIED',
      verdictLabel: 'Verified',
      confidence,
      formName,
      documentName: docName,
      normalizedFormName: normForm,
      normalizedDocName: normDoc,
      differenceExplanation: isReversedOrder
        ? hasInitial
          ? 'Names match with initials positioned as prefix vs suffix according to regional naming conventions.'
          : 'Exact word match with reversed token sequence (Given Name / Surname transposition).'
        : 'All name tokens match completely.',
      recommendedAction: 'Automated pass confirmed. Token ordering matches regional conventions.',
      matchType: hasInitial ? 'INITIAL_MATCH' : 'TOKEN_REARRANGEMENT',
      details: {
        editDistance: levenshteinDistance(normForm, normDoc),
        tokenSimilarity: 100,
        initialsAligned: true,
        notes: ['All tokens match under sort permutation.'],
      },
    };
  }

  // 4. Initial Alignment Check with 1-character spelling variation in surname
  // Example 5: Form Name "R. Kumar" vs Document Name "R. Kumer"
  if (tokensForm.length === tokensDoc.length && tokensForm.length === 2) {
    const initialForm = tokensForm.find((t) => t.length === 1);
    const wordForm = tokensForm.find((t) => t.length > 1);
    const initialDoc = tokensDoc.find((t) => t.length === 1);
    const wordDoc = tokensDoc.find((t) => t.length > 1);

    if (initialForm && initialDoc && wordForm && wordDoc) {
      if (initialForm === initialDoc) {
        const wordDist = levenshteinDistance(wordForm, wordDoc);
        if (wordDist === 1) {
          // Exactly 1 typo with identical initial!
          return {
            verdict: 'POSSIBLE_MATCH_MANUAL_REVIEW',
            verdictLabel: 'Possible Match – Manual Review Required',
            confidence: 82,
            formName,
            documentName: docName,
            normalizedFormName: normForm,
            normalizedDocName: normDoc,
            differenceExplanation: `Initial '${initialForm.toUpperCase()}' matches, but a minor single-character spelling difference was detected in '${wordForm}' vs '${wordDoc}'.`,
            recommendedAction: 'Review secondary certificates (10th/12th marksheets) to confirm spelling variant.',
            matchType: 'MINOR_SPELLING_VARIATION',
            details: {
              editDistance: 1,
              tokenSimilarity: 82,
              initialsAligned: true,
              notes: [`Initial '${initialForm.toUpperCase()}' matches`, `Word edit distance: 1 ('${wordForm}' vs '${wordDoc}')`],
            },
          };
        }
      }
    }
  }

  // 5. Phonetic / Regional Indian Transliteration Equivalence
  // Example: "Gowtham" vs "Goutham" or "Gowtham Raj" vs "Goutham Raj"
  // Also supports reversed order + phonetic (e.g. "Raj Goutham" vs "Gowtham Raj")
  const phoneticForm = phoneticTransliterate(formName);
  const phoneticDoc = phoneticTransliterate(docName);

  const phoneticTokensForm = getTokens(phoneticForm).sort().join(' ');
  const phoneticTokensDoc = getTokens(phoneticDoc).sort().join(' ');

  if ((phoneticForm === phoneticDoc || phoneticTokensForm === phoneticTokensDoc) && phoneticForm.length > 0) {
    return {
      verdict: 'VERIFIED',
      verdictLabel: 'Verified',
      confidence: 93,
      formName,
      documentName: docName,
      normalizedFormName: normForm,
      normalizedDocName: normDoc,
      differenceExplanation: 'Names match phonetically under regional transliteration conventions (e.g. "ow" vs "ou", "v" vs "w", "ee" vs "i", "ksh" vs "x").',
      recommendedAction: 'Automated pass confirmed with phonetic transliteration equivalence.',
      matchType: 'PHONETIC_TRANSLITERATION',
      details: {
        phoneticEquivalence: true,
        editDistance: levenshteinDistance(normForm, normDoc),
        notes: ['Phonetically equivalent under regional Tamil/Indian English spelling rules.'],
      },
    };
  }

  // 6. Word-by-word alignment and Levenshtein / Jaro-Winkler analysis
  // Example 4: Form Name "Arun Kumar" vs Document Name "Arun Kumer"
  if (tokensForm.length === tokensDoc.length && tokensForm.length > 0) {
    let exactWordMatches = 0;
    let singleTypoMatches = 0;
    const wordDifferences: string[] = [];

    // Try positional alignment or sorted token alignment
    const sForm = [...tokensForm].sort();
    const sDoc = [...tokensDoc].sort();

    for (let i = 0; i < sForm.length; i++) {
      const wForm = sForm[i];
      const wDoc = sDoc[i];

      if (wForm === wDoc) {
        exactWordMatches++;
      } else {
        const dist = levenshteinDistance(wForm, wDoc);
        if (dist === 1 && wForm.length >= 4 && wDoc.length >= 4) {
          singleTypoMatches++;
          wordDifferences.push(`'${wForm}' vs '${wDoc}' (1 letter diff)`);
        } else {
          wordDifferences.push(`'${wForm}' vs '${wDoc}'`);
        }
      }
    }

    if (exactWordMatches === sForm.length - 1 && singleTypoMatches === 1) {
      return {
        verdict: 'POSSIBLE_MATCH_MANUAL_REVIEW',
        verdictLabel: 'Possible Match – Manual Review Required',
        confidence: 85,
        formName,
        documentName: docName,
        normalizedFormName: normForm,
        normalizedDocName: normDoc,
        differenceExplanation: `Minor single-character spelling discrepancy detected (${wordDifferences.join(', ')}). Likely typo or certificate spelling variation.`,
        recommendedAction: 'Flagged for human reviewer to inspect document scan and authorize spelling reconciliation.',
        matchType: 'MINOR_SPELLING_VARIATION',
        details: {
          editDistance: 1,
          tokenSimilarity: 85,
          notes: wordDifferences,
        },
      };
    }
  }

  // 7. Advanced Initial Expansion & Omission Check
  // e.g. "R. Kumar" vs "Ramanathan Kumar", or "Deepika Senthil Kumar" vs "Deepika S"
  const complexAlignment = checkComplexInitialAndTokenAlignment(tokensForm, tokensDoc);
  if (complexAlignment.isMatch) {
    return {
      verdict: 'POSSIBLE_MATCH_MANUAL_REVIEW',
      verdictLabel: 'Possible Match – Manual Review Required',
      confidence: complexAlignment.confidence,
      formName,
      documentName: docName,
      normalizedFormName: normForm,
      normalizedDocName: normDoc,
      differenceExplanation: complexAlignment.explanation,
      recommendedAction: 'Cross-verify candidate secondary certificates or Transfer Certificate for father name expansion.',
      matchType: complexAlignment.matchType,
      details: {
        initialsAligned: true,
        notes: [complexAlignment.explanation],
      },
    };
  }

  // 8. Comprehensive Levenshtein + Jaro-Winkler Fuzzy Metrics
  const jwScore = Math.round(jaroWinklerSimilarity(normForm, normDoc) * 100);
  const levDist = levenshteinDistance(normForm, normDoc);
  const maxLen = Math.max(normForm.length, normDoc.length);
  const levScore = Math.max(0, Math.round((1 - levDist / maxLen) * 100));

  // Weighted overall fuzzy score
  const overallScore = Math.round(jwScore * 0.6 + levScore * 0.4);

  // If score is high (>= 90): Verified
  if (overallScore >= config.verifiedThreshold && levDist <= 1) {
    return {
      verdict: 'VERIFIED',
      verdictLabel: 'Verified',
      confidence: overallScore,
      formName,
      documentName: docName,
      normalizedFormName: normForm,
      normalizedDocName: normDoc,
      differenceExplanation: 'High-confidence fuzzy string match within acceptable threshold.',
      recommendedAction: 'Automated pass confirmed.',
      matchType: 'MINOR_SPELLING_VARIATION',
      details: {
        editDistance: levDist,
        tokenSimilarity: overallScore,
      },
    };
  }

  // If score is moderate (65 - 89): Possible Match - Manual Review Required
  if (overallScore >= config.manualReviewThreshold || levDist <= 2) {
    return {
      verdict: 'POSSIBLE_MATCH_MANUAL_REVIEW',
      verdictLabel: 'Possible Match – Manual Review Required',
      confidence: overallScore,
      formName,
      documentName: docName,
      normalizedFormName: normForm,
      normalizedDocName: normDoc,
      differenceExplanation: `Fuzzy similarity is ${overallScore}% with edit distance ${levDist}. Minor difference warrants manual verification.`,
      recommendedAction: 'Manual review required by admission officer.',
      matchType: 'MINOR_SPELLING_VARIATION',
      details: {
        editDistance: levDist,
        tokenSimilarity: overallScore,
      },
    };
  }

  // 9. Low similarity (< 65): Genuine Name Mismatch
  // Example 3: Form Name "Gowtham Raj" vs Document Name "Suresh Kumar"
  return {
    verdict: 'NAME_MISMATCH',
    verdictLabel: 'Name Mismatch',
    confidence: overallScore,
    formName,
    documentName: docName,
    normalizedFormName: normForm,
    normalizedDocName: normDoc,
    differenceExplanation: `The applicant form name '${formName}' and document name '${docName}' appear significantly different (Similarity: ${overallScore}%).`,
    recommendedAction: 'Application flagged for rejection or request for valid identity document belonging to the applicant.',
    matchType: 'SUBSTANTIAL_MISMATCH',
    details: {
      editDistance: levDist,
      tokenSimilarity: overallScore,
      notes: ['No matching token or initials found between candidate name and document name.'],
    },
  };
}

/**
 * Test case runner for the user's required scenarios and standard edge cases
 */
export interface NameVerificationTestCase {
  id: string;
  description: string;
  formName: string;
  docName: string;
  expectedVerdict: NameVerificationVerdict;
  expectedMinConfidence?: number;
}

export const OFFICIAL_NAME_TEST_CASES: NameVerificationTestCase[] = [
  {
    id: 'case-1',
    description: 'Example 1: Initial with reversed order (R. Kumar vs Kumar R)',
    formName: 'R. Kumar',
    docName: 'Kumar R',
    expectedVerdict: 'VERIFIED',
    expectedMinConfidence: 90,
  },
  {
    id: 'case-2',
    description: 'Example 2: Exact Match (Gowtham Raj vs Gowtham Raj)',
    formName: 'Gowtham Raj',
    docName: 'Gowtham Raj',
    expectedVerdict: 'VERIFIED',
    expectedMinConfidence: 100,
  },
  {
    id: 'case-3',
    description: 'Example 3: Genuine Mismatch (Gowtham Raj vs Suresh Kumar)',
    formName: 'Gowtham Raj',
    docName: 'Suresh Kumar',
    expectedVerdict: 'NAME_MISMATCH',
  },
  {
    id: 'case-4',
    description: 'Example 4: Spelling Mistake (Arun Kumar vs Arun Kumer)',
    formName: 'Arun Kumar',
    docName: 'Arun Kumer',
    expectedVerdict: 'POSSIBLE_MATCH_MANUAL_REVIEW',
    expectedMinConfidence: 75,
  },
  {
    id: 'case-5',
    description: 'Example 5: Initial + Spelling Mistake (R. Kumar vs R. Kumer)',
    formName: 'R. Kumar',
    docName: 'R. Kumer',
    expectedVerdict: 'POSSIBLE_MATCH_MANUAL_REVIEW',
    expectedMinConfidence: 75,
  },
  {
    id: 'case-6',
    description: 'Spelling Variation: Phonetic transliteration (Gowtham vs Goutham)',
    formName: 'Gowtham',
    docName: 'Goutham',
    expectedVerdict: 'VERIFIED',
    expectedMinConfidence: 90,
  },
  {
    id: 'case-7',
    description: 'Expanded Initial: (R. Kumar vs Ramanathan Kumar)',
    formName: 'R. Kumar',
    docName: 'Ramanathan Kumar',
    expectedVerdict: 'POSSIBLE_MATCH_MANUAL_REVIEW',
    expectedMinConfidence: 80,
  },
  {
    id: 'case-8',
    description: 'Reversed Name Order: (Kumar Raj vs Raj Kumar)',
    formName: 'Kumar Raj',
    docName: 'Raj Kumar',
    expectedVerdict: 'VERIFIED',
    expectedMinConfidence: 95,
  },
  {
    id: 'case-9',
    description: 'Punctuation & Extra Spaces: (  R.  Kumar . vs r kumar )',
    formName: '  R.  Kumar .',
    docName: 'r kumar',
    expectedVerdict: 'VERIFIED',
    expectedMinConfidence: 95,
  },
  {
    id: 'case-10',
    description: 'Unreadable or Missing Document: (Gowtham Raj vs "")',
    formName: 'Gowtham Raj',
    docName: '',
    expectedVerdict: 'UNABLE_TO_VERIFY',
  },
  {
    id: 'case-11',
    description: 'Regional Transliteration: (Lakshmi vs Laxmi)',
    formName: 'Lakshmi',
    docName: 'Laxmi',
    expectedVerdict: 'VERIFIED',
    expectedMinConfidence: 90,
  },
  {
    id: 'case-12',
    description: 'Multi-Token Initial & Patronymic: (Deepika Senthil Kumar vs Deepika S)',
    formName: 'Deepika Senthil Kumar',
    docName: 'Deepika S',
    expectedVerdict: 'POSSIBLE_MATCH_MANUAL_REVIEW',
    expectedMinConfidence: 80,
  },
];

export function runNameVerificationTestCases(): {
  allPassed: boolean;
  total: number;
  passedCount: number;
  results: Array<{
    testCase: NameVerificationTestCase;
    passed: boolean;
    actualResult: NameVerificationResult;
  }>;
} {
  const results = OFFICIAL_NAME_TEST_CASES.map((tc) => {
    const actualResult = verifyStudentName(tc.formName, tc.docName);
    const passed =
      actualResult.verdict === tc.expectedVerdict &&
      (tc.expectedMinConfidence === undefined ||
        (actualResult.confidence !== null && actualResult.confidence >= tc.expectedMinConfidence));

    return {
      testCase: tc,
      passed,
      actualResult,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;

  return {
    allPassed: passedCount === results.length,
    total: results.length,
    passedCount,
    results,
  };
}

/**
 * Common institutional keywords or headers that should NEVER be mistaken for a student name.
 */
const INSTITUTIONAL_HEADERS_BLOCKLIST = [
  'government of tamil nadu',
  'directorate of government examinations',
  'board of higher secondary education',
  'secondary school leaving certificate',
  'higher secondary course certificate',
  'statement of marks',
  'transfer certificate',
  'community certificate',
  'income certificate',
  'birth certificate',
  'permanent record',
  'tamil nadu state board',
  'central board of secondary education',
  'council for the indian school certificate',
  'unique identification authority of india',
  'government of india',
  'candidate name',
  'student name',
  'pupil name',
  'date of birth',
  'register number',
  'roll number',
  'serial number',
  'marksheet number',
];

function cleanExtractedCandidateName(raw: string): string {
  let val = raw.trim();
  // Strip common honorifics / salutations
  val = val.replace(/^(?:Selvan|Selvi|Thiru|Tmt|Mr|Ms|Mrs|Master|Kumari|Shri|Smt)\.?\s+/i, '');
  // Strip trailing punctuation and delimiters
  val = val.replace(/[,;:\-\.\/]+$/, '').trim();
  // Collapse whitespace
  val = val.replace(/\s+/g, ' ');
  return val;
}

function isValidCandidateName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 60) return false;
  // Must have alphabetic characters
  if (!/[a-zA-Z]/.test(name)) return false;
  // Cannot be digits or punctuation only
  if (/^[\d\s\-_:\.\/]+$/.test(name)) return false;
  const lower = name.toLowerCase().trim();
  for (const header of INSTITUTIONAL_HEADERS_BLOCKLIST) {
    if (lower === header || lower.startsWith(header + ' ') || lower.endsWith(' ' + header)) {
      return false;
    }
  }
  return true;
}

/**
 * Extracts candidate name strictly from inside document text / OCR tokens (never from filename).
 */
export function extractCandidateNameFromText(text: string | null | undefined, _docType?: string): string | null {
  if (!text || !text.trim()) return null;

  // 1. Structured OCR token streams (e.g. TOKEN_NAME: "Karthik Ramanathan")
  const tokenMatch = text.match(/TOKEN_(?:NAME|STUDENTNAME|CHILDNAME|CANDIDATENAME):\s*["']([^"'\n\r]+)["']/i);
  if (tokenMatch && tokenMatch[1]) {
    const cleaned = cleanExtractedCandidateName(tokenMatch[1]);
    if (isValidCandidateName(cleaned)) return cleaned;
  }

  // 2. Explicit labeled name patterns:
  // "Candidate Name: Karthik Ramanathan"
  // "Student Name : R. Karthik"
  // "Name of the Candidate / Pupil: Karthik Ramanathan"
  const labeledPatterns = [
    /(?:Name\s+of\s+(?:the\s+)?(?:Candidate|Student|Pupil|Applicant)|Candidate\s+Name|Student(?:\x27s)?\s+Name|Pupil(?:\x27s)?\s+Name)\s*[:\-]\s*([A-Za-z\s\.\'\-]+?)(?=\s+(?:Register|Reg|Roll|DOB|Date|Total|Father|Mother|Son|Daughter|S\/o|D\/o|Standard|Class|\n|\r|$))/i,
    /(?:^|\n|\r)\s*(?:Candidate|Student|Pupil)?\s*Name\s*[:\-]\s*([A-Za-z\s\.\'\-]+?)(?=\s+(?:Register|Reg|Roll|DOB|Date|Total|Father|Mother|Son|Daughter|S\/o|D\/o|\n|\r|$))/i,
  ];

  for (const pattern of labeledPatterns) {
    const m = text.match(pattern);
    if (m && m[1]) {
      const cleaned = cleanExtractedCandidateName(m[1]);
      if (isValidCandidateName(cleaned)) return cleaned;
    }
  }

  // 3. Certify that statement pattern (e.g. Transfer, Community, or Income certificate):
  // "This is to certify that Selvan / Selvi / Mr / Ms [Candidate Name] son of / daughter of..."
  const certifyMatch = text.match(
    /(?:This\s+is\s+to\s+certify\s+that|Certify\s+that)\s+(?:Selvan|Selvi|Thiru|Tmt|Mr|Ms|Kumari|Master)?\.?\s*([A-Za-z\s\.\'\-]+?)(?=\s+(?:son\s+of|daughter\s+of|S\/o|D\/o|has\s+passed|is\s+a\s+student|residing|belongs|\n|\r|,))/i
  );
  if (certifyMatch && certifyMatch[1]) {
    const cleaned = cleanExtractedCandidateName(certifyMatch[1]);
    if (isValidCandidateName(cleaned)) return cleaned;
  }

  // 4. Aadhaar card layout pattern:
  // In official Aadhaar UIDAI cards, the applicant name is printed immediately above the line containing DOB / Date of Birth
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:DOB|Date of Birth|Year of Birth)\s*[:\-]/i.test(line)) {
      if (i > 0) {
        const prevLine = lines[i - 1];
        const cleaned = cleanExtractedCandidateName(prevLine);
        if (isValidCandidateName(cleaned)) return cleaned;
      }
    }
  }

  // 5. Line starting with "Name : <Value>"
  for (const line of lines) {
    const simpleMatch = line.match(/^Name\s*[:\-]\s*([A-Za-z\s\.\'\-]+)$/i);
    if (simpleMatch && simpleMatch[1]) {
      const cleaned = cleanExtractedCandidateName(simpleMatch[1]);
      if (isValidCandidateName(cleaned)) return cleaned;
    }
  }

  return null;
}

/**
 * Intelligent In-Document Name Extractor
 * Reads candidate name strictly from within the document:
 * 1. Explicit extractedName property (derived from document content)
 * 2. In-document OCR extracted text stream (via regex & NLP entity parsing)
 * 3. Structured payload from the scanning engine
 *
 * NOTE: Filename extraction is deliberately NOT performed here.
 * The verification engine strictly verifies names printed INSIDE the document content.
 */
export function extractDocumentName(
  doc: {
    name?: string;
    mockDataPayload?: Record<string, string | number>;
    extractedName?: string;
    ocrExtractedText?: string;
  } | null | undefined
): { extractedName: string | null; quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNREADABLE' } {
  if (!doc) {
    return { extractedName: null, quality: 'UNREADABLE' };
  }

  // 1. Explicitly recorded in-document OCR extracted name
  if (doc.extractedName && doc.extractedName.trim()) {
    return { extractedName: doc.extractedName.trim(), quality: 'HIGH' };
  }

  // 2. In-Document OCR Text Stream parsing
  if (doc.ocrExtractedText && doc.ocrExtractedText.trim()) {
    const textName = extractCandidateNameFromText(doc.ocrExtractedText);
    if (textName && textName.trim()) {
      return { extractedName: textName.trim(), quality: 'HIGH' };
    }
  }

  // 3. Structured Payload from scanning engine
  if (doc.mockDataPayload) {
    const pName =
      (doc.mockDataPayload.name as string) ||
      (doc.mockDataPayload.studentName as string) ||
      (doc.mockDataPayload.candidateName as string) ||
      (doc.mockDataPayload.childName as string);
    if (pName && pName.trim()) {
      return { extractedName: pName.trim(), quality: 'HIGH' };
    }
  }

  // No candidate name found inside document content
  return { extractedName: null, quality: 'UNREADABLE' };
}

/**
 * Creates an ExplainableMatchField for name comparison
 */
export function createNameMatchField(
  formName: string,
  docName: string | null | undefined,
  fieldName: string = 'Candidate Name',
  docTitle: string = 'Document',
  config: NameVerificationConfig = DEFAULT_NAME_CONFIG
): {
  fieldName: string;
  submittedValue: string;
  extractedValue: string;
  matchResult: 'MATCH' | 'MISMATCH' | 'PARTIAL' | 'NOT_APPLICABLE' | 'MANUAL_REVIEW';
  confidence: number | null;
  reason: string;
  recommendedAction: string;
  nameVerdict: NameVerificationVerdict;
  nameVerdictLabel: string;
  matchType: NameMatchType;
} {
  const result = verifyStudentName(formName, docName || '', docTitle, config);

  let matchResult: 'MATCH' | 'MISMATCH' | 'PARTIAL' | 'NOT_APPLICABLE' | 'MANUAL_REVIEW';
  if (result.verdict === 'VERIFIED') matchResult = 'MATCH';
  else if (result.verdict === 'POSSIBLE_MATCH_MANUAL_REVIEW') matchResult = 'PARTIAL';
  else if (result.verdict === 'NAME_MISMATCH') matchResult = 'MISMATCH';
  else matchResult = 'MANUAL_REVIEW';

  return {
    fieldName,
    submittedValue: formName || '— (Empty in form)',
    extractedValue: docName || '— (Unable to extract name)',
    matchResult,
    confidence: result.confidence,
    reason: result.differenceExplanation,
    recommendedAction: result.recommendedAction,
    nameVerdict: result.verdict,
    nameVerdictLabel: result.verdictLabel,
    matchType: result.matchType,
  };
}
