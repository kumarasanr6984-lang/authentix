/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Check,
  X,
  ShieldCheck,
  Scale,
  Users,
  ArrowRight,
  ArrowLeft,
  FileText,
  Sparkles,
} from 'lucide-react';
import { StudentApplication, VerificationSummary, VerificationStatusColor } from '../types/admissions';
import { NameVerificationModal } from './NameVerificationModal';

interface VerificationReportViewProps {
  application: StudentApplication;
  verificationSummary: VerificationSummary;
  onProceedToReview: () => void;
  onBackToUpload: () => void;
}

export const VerificationReportView: React.FC<VerificationReportViewProps> = ({
  application,
  verificationSummary,
  onProceedToReview,
  onBackToUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'documents' | 'compliance' | 'duplicate'>('documents');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // Find primary name verification field (e.g. from Aadhaar or 10th marksheet)
  const primaryNameField = verificationSummary.documentsReport
    .flatMap((d) => d.fields)
    .find((f) => f.nameVerdict !== undefined);

  const getNameVerdictBadge = (verdict: string, label?: string) => {
    switch (verdict) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label || 'Verified'}</span>
          </span>
        );
      case 'POSSIBLE_MATCH_MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{label || 'Possible Match – Manual Review Required'}</span>
          </span>
        );
      case 'NAME_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{label || 'Name Mismatch'}</span>
          </span>
        );
      case 'UNABLE_TO_VERIFY':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>{label || 'Unable to Verify'}</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: VerificationStatusColor, label: string) => {
    switch (status) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{label}</span>
          </span>
        );
      case 'yellow':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>{label}</span>
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>{label}</span>
          </span>
        );
      case 'gray':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span>{label}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <span>Step 3 of 4</span>
              <span>·</span>
              <span>Explainable AI Verification Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Autonomous Scrutiny & Verification Report
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-document OCR comparison, visual integrity analysis, and regulatory AICTE/TNEA compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Preliminary Verdict:</span>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-lg font-mono flex items-center gap-1.5 ${
                  verificationSummary.overallStatus === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : verificationSummary.overallStatus === 'MANUAL_REVIEW_REQUIRED'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {verificationSummary.overallStatus === 'PASSED' && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                )}
                {verificationSummary.overallStatus === 'MANUAL_REVIEW_REQUIRED' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                {verificationSummary.overallStatus === 'MISMATCH_DETECTED' && (
                  <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[3]" />
                )}
                <span>
                  {verificationSummary.overallStatus === 'PASSED'
                    ? 'VERIFIED (PASSED)'
                    : verificationSummary.overallStatus.replace(/_/g, ' ')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl border border-slate-300/60 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Document OCR & Integrity Reports ({verificationSummary.documentsReport.length})
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'compliance'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Regulatory Compliance Norms ({verificationSummary.complianceRules.length})
          </button>
          <button
            onClick={() => setActiveTab('duplicate')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'duplicate'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Duplicate Application Scrutiny
          </button>
        </div>

        {/* TAB 1: DOCUMENT OCR & INTEGRITY REPORTS */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Dedicated Form Name vs Document Name Verification Spotlight */}
            {primaryNameField && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Student Identity & Name Verification Status
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Form Name vs Extracted Document Name (Fuzzy & OCR Token Matching)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getNameVerdictBadge(
                      primaryNameField.nameVerdict || 'UNABLE_TO_VERIFY',
                      primaryNameField.nameVerdictLabel
                    )}
                    <button
                      type="button"
                      onClick={() => setIsNameModalOpen(true)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Test Variations
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Application Form Name
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                      {primaryNameField.submittedValue}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Uploaded Document Name (Extracted)
                    </span>
                    <span className="text-sm font-mono font-bold text-blue-900 dark:text-blue-300">
                      {primaryNameField.extractedValue}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Match Confidence
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
                        {primaryNameField.confidence !== null ? `${primaryNameField.confidence}%` : '—'}
                      </span>
                      {primaryNameField.confidence !== null && (
                        <span className="text-[10px] text-slate-500">
                          {primaryNameField.confidence >= 90
                            ? '(Sufficient)'
                            : primaryNameField.confidence >= 65
                            ? '(Moderate)'
                            : '(Low)'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  {primaryNameField.nameVerdict === 'VERIFIED' ? (
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="space-y-1 text-rose-700 dark:text-rose-400">
                      <div className="flex items-start gap-1.5 font-semibold">
                        <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 stroke-[3]" />
                        <span>{primaryNameField.reason}</span>
                      </div>
                      {primaryNameField.recommendedAction && (
                        <p className="text-blue-700 dark:text-blue-400 text-[11px] pl-5 font-medium">
                          {primaryNameField.recommendedAction}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {verificationSummary.documentsReport.map((docReport) => (
              <div
                key={docReport.documentId}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4"
              >
                {/* Document Card Header */}
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{docReport.documentTitle}</h3>
                      <p className="text-xs text-slate-500">
                        {docReport.integrityScore
                          ? `Visual Integrity Confidence: ${docReport.integrityScore}`
                          : 'Provisional/Expected status'}
                      </p>
                    </div>
                  </div>

                  <div>{getStatusBadge(docReport.status, docReport.statusLabel)}</div>
                </div>

                {/* Explainable Fields Comparison Table */}
                <div className="px-5 pb-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Field Name</th>
                          <th className="py-2.5 px-3">Submitted Value</th>
                          <th className="py-2.5 px-3">Extracted Value</th>
                          <th className="py-2.5 px-3">Match Verdict</th>
                          <th className="py-2.5 px-3">Confidence</th>
                          <th className="py-2.5 px-3">Reason & Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {docReport.fields.map((fld, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                              {fld.fieldName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-800">
                              {fld.submittedValue}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-blue-900">
                              {fld.extractedValue}
                            </td>
                            <td className="py-2.5 px-3">
                              {fld.nameVerdict ? (
                                getNameVerdictBadge(fld.nameVerdict, fld.nameVerdictLabel)
                              ) : fld.matchResult === 'MATCH' ? (
                                <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>MATCH</span>
                                </span>
                              ) : fld.matchResult === 'PARTIAL' ? (
                                <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>PARTIAL</span>
                                </span>
                              ) : (
                                <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>MISMATCH</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums">
                              {fld.confidence !== null ? `${fld.confidence}%` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] max-w-xs">
                              {(fld.nameVerdict ? fld.nameVerdict === 'VERIFIED' : fld.matchResult === 'MATCH') ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-start gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                                    <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 stroke-[3]" />
                                    <span>{fld.reason}</span>
                                  </div>
                                  {fld.recommendedAction && (
                                    <p className="text-blue-700 dark:text-blue-400 text-[10px] pl-5 font-medium">
                                      {fld.recommendedAction}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Visual Anomaly Warnings if any */}
                  {docReport.integrityAnomalies.length > 0 && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Visual Anomaly Flagged for Manual Officer Inspection:</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-rose-700">
                        {docReport.integrityAnomalies.map((anom, i) => (
                          <li key={i}>{anom}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: REGULATORY COMPLIANCE NORMS */}
        {activeTab === 'compliance' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Statutory Regulatory Compliance Audit
              </h2>
              <p className="text-xs text-slate-500">
                Automated evaluation against AICTE Approval Process Handbook, Anna University B.E./B.Tech norms, and Tamil Nadu State reservation quotas.
              </p>
            </div>

            <div className="space-y-4">
              {verificationSummary.complianceRules.map((rule) => (
                <div
                  key={rule.ruleId}
                  className={`p-5 rounded-xl border transition-all ${
                    rule.passed
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {rule.ruleId}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{rule.ruleTitle}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                        {rule.authority}
                      </span>
                      {rule.passed ? (
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>COMPLIANT</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>NON-COMPLIANT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-white/80 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Prescribed Regulatory Requirement:
                      </span>
                      <span className="text-slate-800 mt-0.5 block">{rule.requirement}</span>
                    </div>

                    <div className="p-3 bg-white/80 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Candidate Actual Status:
                      </span>
                      <span className="text-slate-900 font-semibold mt-0.5 block">
                        {rule.actualStatus}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-1">{rule.details}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DUPLICATE APPLICATION SCRUTINY */}
        {activeTab === 'duplicate' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Multi-Identifier Duplicate Application Screening
              </h2>
              <p className="text-xs text-slate-500">
                Identifies fraudulent or redundant multi-submissions across institutions using UIDAI Aadhaar, 10th/12th Board serials, and candidate bio-data.
              </p>
            </div>

            <div
              className={`p-6 rounded-2xl border ${
                verificationSummary.duplicateCheck.isDuplicateSuspected
                  ? 'border-amber-300 bg-amber-50/70'
                  : 'border-emerald-200 bg-emerald-50/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    verificationSummary.duplicateCheck.isDuplicateSuspected
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {verificationSummary.duplicateCheck.isDuplicateSuspected ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Users className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {verificationSummary.duplicateCheck.isDuplicateSuspected
                      ? 'Potential Duplicate Application Collision Detected'
                      : 'Unique Candidate Record Confirmed'}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {verificationSummary.duplicateCheck.explanation}
                  </p>

                  {verificationSummary.duplicateCheck.isDuplicateSuspected && (
                    <div className="pt-2 text-xs font-semibold text-amber-900">
                      <span>Matched Record Reference ID: </span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
                        {verificationSummary.duplicateCheck.matchedApplicationId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onBackToUpload}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Document Upload</span>
          </button>

          <button
            type="button"
            onClick={onProceedToReview}
            className="flex items-center gap-2 px-8 py-3 text-xs font-extrabold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-700/25 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Proceed to Application Review & Submit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Name Verification Diagnostic Modal */}
      <NameVerificationModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        initialFormName={application.personal.fullName || 'R. Kumar'}
        initialDocName={primaryNameField?.extractedValue || 'Kumar R'}
      />
    </div>
  );
};
