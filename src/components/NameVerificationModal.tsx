/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  Sliders,
  FileCheck2,
} from 'lucide-react';
import {
  verifyStudentName,
  runNameVerificationTestCases,
  OFFICIAL_NAME_TEST_CASES,
  NameVerificationVerdict,
  NameVerificationResult,
} from '../services/nameVerificationService';

interface NameVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormName?: string;
  initialDocName?: string;
}

export const NameVerificationModal: React.FC<NameVerificationModalProps> = ({
  isOpen,
  onClose,
  initialFormName = 'R. Kumar',
  initialDocName = 'Kumar R',
}) => {
  const [activeTab, setActiveTab] = useState<'interactive' | 'testsuite'>('interactive');
  const [formNameInput, setFormNameInput] = useState(initialFormName);
  const [docNameInput, setDocNameInput] = useState(initialDocName);
  const [documentType, setDocumentType] = useState('Aadhaar Identification Document');
  const [verifiedThreshold, setVerifiedThreshold] = useState(90);
  const [manualReviewThreshold, setManualReviewThreshold] = useState(65);
  const [showConfig, setShowConfig] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<ReturnType<typeof runNameVerificationTestCases> | null>(() => runNameVerificationTestCases());

  if (!isOpen) return null;

  // Calculate live verification with configurable thresholds
  const liveResult: NameVerificationResult = verifyStudentName(
    formNameInput,
    docNameInput,
    documentType,
    { verifiedThreshold, manualReviewThreshold }
  );

  const getVerdictBadge = (verdict: NameVerificationVerdict) => {
    switch (verdict) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Verified</span>
          </span>
        );
      case 'POSSIBLE_MATCH_MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Possible Match – Manual Review Required</span>
          </span>
        );
      case 'NAME_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800">
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Name Mismatch</span>
          </span>
        );
      case 'UNABLE_TO_VERIFY':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Unable to Verify</span>
          </span>
        );
    }
  };

  const handleApplyPreset = (formName: string, docName: string) => {
    setFormNameInput(formName);
    setDocNameInput(docName);
  };

  const handleRunSuite = () => {
    setTestSuiteResults(runNameVerificationTestCases());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Intelligent Name Verification & OCR Inspector
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Fuzzy Match Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluates initials, reversed word orders, spelling mistakes, and regional Indian naming patterns.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('interactive')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'interactive'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Interactive Name Comparison Tester
          </button>
          <button
            onClick={() => setActiveTab('testsuite')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'testsuite'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Automated Test Cases</span>
            {testSuiteResults && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                {testSuiteResults.passedCount}/{testSuiteResults.total} Passed
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'interactive' ? (
            <div className="space-y-6">
              {/* Presets Row */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Quick Load Test Scenarios:
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('R. Kumar', 'Kumar R')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Ex 1: R. Kumar vs Kumar R
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Gowtham Raj', 'Gowtham Raj')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Ex 2: Gowtham Raj (Exact)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Gowtham Raj', 'Suresh Kumar')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Ex 3: Gowtham Raj vs Suresh Kumar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Arun Kumar', 'Arun Kumer')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Ex 4: Arun Kumar vs Arun Kumer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('R. Kumar', 'R. Kumer')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Ex 5: R. Kumar vs R. Kumer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Gowtham', 'Goutham')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Phonetic: Gowtham vs Goutham
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('R. Kumar', 'Ramanathan Kumar')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Expanded: R. Kumar vs Ramanathan Kumar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Lakshmi', 'Laxmi')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Transliteration: Lakshmi vs Laxmi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Deepika Senthil Kumar', 'Deepika S')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Patronymic: Deepika Senthil Kumar vs Deepika S
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('R. Kumar', '')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 cursor-pointer font-mono"
                  >
                    Unreadable / Empty Scan
                  </button>
                </div>
              </div>

              {/* Configurable Thresholds Bar */}
              <div className="p-3.5 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Configurable Confidence Thresholds
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Verified: &ge;{verifiedThreshold}%, Review: &ge;{manualReviewThreshold}%)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {showConfig ? 'Hide Settings' : 'Adjust Thresholds'}
                  </button>
                </div>

                {showConfig && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in">
                    <div>
                      <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <span>Verified Threshold (Auto-Pass):</span>
                        <span className="font-mono font-bold text-emerald-600">{verifiedThreshold}%</span>
                      </div>
                      <input
                        type="range"
                        min="75"
                        max="98"
                        value={verifiedThreshold}
                        onChange={(e) => setVerifiedThreshold(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Matches at or above this score are marked 'Verified'.
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <span>Manual Review Threshold:</span>
                        <span className="font-mono font-bold text-amber-600">{manualReviewThreshold}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="85"
                        value={manualReviewThreshold}
                        onChange={(e) => setManualReviewThreshold(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Matches between review threshold & verified threshold trigger manual inspection.
                      </span>
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setVerifiedThreshold(90);
                          setManualReviewThreshold(65);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 cursor-pointer"
                      >
                        Reset to Defaults (90% / 65%)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Application Form Name (Submitted by Student)
                  </label>
                  <input
                    type="text"
                    value={formNameInput}
                    onChange={(e) => setFormNameInput(e.target.value)}
                    placeholder="e.g. R. Kumar, Gowtham Raj"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-500">Candidate's entered legal name</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Document Extracted Name (OCR / Cryptographic Extract)
                  </label>
                  <input
                    type="text"
                    value={docNameInput}
                    onChange={(e) => setDocNameInput(e.target.value)}
                    placeholder="Leave blank to simulate unreadable / degraded scan"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-blue-900 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-500">Extracted from scan or DigiLocker XML</span>
                </div>
              </div>

              {/* Verification Result Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Verification Outcome
                    </span>
                    <div>{getVerdictBadge(liveResult.verdict)}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Confidence Match</span>
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                        {liveResult.confidence !== null ? `${liveResult.confidence}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation of differences */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Explanation of Discrepancies</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {liveResult.differenceExplanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Recommended Action</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {liveResult.recommendedAction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Algorithmic Details Breakdown */}
                {liveResult.details && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Match Type</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {liveResult.matchType}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Levenshtein Edit Dist</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {liveResult.details.editDistance ?? '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Token Rearrangement</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {liveResult.details.tokenSimilarity !== undefined ? `${liveResult.details.tokenSimilarity}%` : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Initials Aligned</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {liveResult.details.initialsAligned ? 'Yes' : 'No / N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Test Suite Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Mandatory Name Verification Test Suite
                  </h4>
                  <p className="text-xs text-slate-500">
                    Automated tests covering all specified example scenarios, initials, typos, and transliterations.
                  </p>
                </div>
                <button
                  onClick={handleRunSuite}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-Run All Tests</span>
                </button>
              </div>

              {testSuiteResults && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Test Case</th>
                        <th className="py-2.5 px-3">Form Name</th>
                        <th className="py-2.5 px-3">Document Name</th>
                        <th className="py-2.5 px-3">Expected Verdict</th>
                        <th className="py-2.5 px-3">Actual Result</th>
                        <th className="py-2.5 px-3">Pass / Fail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {testSuiteResults.results.map((r) => (
                        <tr key={r.testCase.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {r.testCase.description}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                            {r.testCase.formName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-blue-800 dark:text-blue-300">
                            {r.testCase.docName || '<EMPTY / UNREADABLE>'}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400">
                            {r.testCase.expectedVerdict}
                          </td>
                          <td className="py-2.5 px-3">{getVerdictBadge(r.actualResult.verdict)}</td>
                          <td className="py-2.5 px-3">
                            {r.passed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <Check className="w-4 h-4" />
                                <span>PASS</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                                <X className="w-4 h-4" />
                                <span>FAIL</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
