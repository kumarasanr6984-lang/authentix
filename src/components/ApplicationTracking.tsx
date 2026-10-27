/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  FileText,
  ArrowRight,
  ShieldAlert,
  Save,
  Check,
  Building,
  User,
  History,
  Download,
} from 'lucide-react';
import { StudentApplication, ApplicationStatus } from '../types/admissions';
import {
  getApplicationById,
  findApplicationsByQuery,
  saveStoredApplications,
  getStoredApplications,
} from '../services/storage';
import { runDocumentVerificationPipeline } from '../services/verificationEngine';
import { generateFormalApplicationPdf } from '../services/formalPdfGenerator';
import { useThemeLanguage } from '../context/ThemeLanguageContext.tsx';

interface ApplicationTrackingProps {
  initialSearchId?: string;
  onNavigateToForm?: (app: StudentApplication) => void;
}

export const ApplicationTracking: React.FC<ApplicationTrackingProps> = ({
  initialSearchId = '',
  onNavigateToForm,
}) => {
  const { t } = useThemeLanguage();
  const [searchQuery, setSearchQuery] = useState(initialSearchId);
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(() => {
    if (initialSearchId) {
      return getApplicationById(initialSearchId) || null;
    }
    // Default show EVA-2026-0003 for highlighting the Smart Correction Assistant
    return getApplicationById('EVA-2026-0003') || null;
  });

  // Correction Assistant Form State
  const [correctionFieldValues, setCorrectionFieldValues] = useState<Record<string, string>>({});
  const [isResubmitted, setIsResubmitted] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const direct = getApplicationById(searchQuery);
    if (direct) {
      setSelectedApp(direct);
      setIsResubmitted(false);
      return;
    }

    const matches = findApplicationsByQuery(searchQuery);
    if (matches.length > 0) {
      setSelectedApp(matches[0]);
      setIsResubmitted(false);
    } else {
      alert(`No application found for query "${searchQuery}". Please verify application ID.`);
    }
  };

  const timelineSteps: { key: string; label: string; subtext: string }[] = [
    {
      key: 'SUBMITTED',
      label: 'Application Submitted',
      subtext: 'Student completed initial bio-data & uploaded documents',
    },
    {
      key: 'PRELIMINARY_VERIFIED',
      label: 'AI Preliminary Scrutiny',
      subtext: 'Autonomous OCR matching and regulatory compliance passed',
    },
    {
      key: 'MANUAL_REVIEW_OR_CORRECTION',
      label: 'Officer Scrutiny / Correction',
      subtext: 'Inconsistencies routed to human admissions committee',
    },
    {
      key: 'ADMINISTRATIVE_REVIEW',
      label: 'Seat Quota Ranking',
      subtext: 'Merit list compilation and department seat assignment',
    },
    {
      key: 'FINAL_DECISION',
      label: 'Final Decision',
      subtext: 'Provisional Admission Approval or Final Rejection',
    },
  ];

  const getStepStatus = (
    stepIdx: number,
    appStatus: ApplicationStatus
  ): 'completed' | 'current' | 'upcoming' | 'action_needed' => {
    if (appStatus === 'APPROVED' || appStatus === 'REJECTED') {
      return 'completed';
    }

    if (stepIdx === 0) return 'completed';

    if (stepIdx === 1) {
      if (appStatus === 'SUBMITTED') return 'current';
      return 'completed';
    }

    if (stepIdx === 2) {
      if (appStatus === 'CORRECTION_REQUESTED') return 'action_needed';
      if (appStatus === 'MANUAL_REVIEW') return 'current';
      if (appStatus === 'PRELIMINARY_VERIFIED') return 'upcoming';
      return 'completed';
    }

    if (stepIdx === 3) {
      if (appStatus === 'ADMINISTRATIVE_REVIEW') return 'current';
      return 'upcoming';
    }

    return 'upcoming';
  };

  // Smart Correction Assistant: Resubmit corrected data
  const handleResubmitCorrection = () => {
    if (!selectedApp) return;

    const updated = { ...selectedApp };
    updated.status = 'PRELIMINARY_VERIFIED';
    updated.lastUpdatedDate = new Date().toISOString();

    if (updated.correctionRequest) {
      updated.correctionRequest.resolved = true;
      updated.correctionRequest.resolvedAt = new Date().toISOString();
    }

    // Apply any edited field values
    if (correctionFieldValues.schoolName) {
      updated.tenth.schoolName = correctionFieldValues.schoolName;
    }
    if (correctionFieldValues.tenthTcNumber) {
      updated.tenth.tcNumber = correctionFieldValues.tenthTcNumber;
      updated.certificates.tenthTcNumber = correctionFieldValues.tenthTcNumber;
    }

    // Re-run verification pipeline to recalculate scores
    const allApps = getStoredApplications();
    updated.verificationSummary = runDocumentVerificationPipeline(updated, allApps);

    // Add audit log
    updated.auditTrail.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Candidate Portal',
      action: 'Correction Resubmitted by Candidate',
      details: `Candidate resolved corrections. Fields updated: ${Object.keys(
        correctionFieldValues
      ).join(', ') || 'Document replaced'}.`,
      previousStatus: 'CORRECTION_REQUESTED',
      newStatus: 'PRELIMINARY_VERIFIED',
    });

    const existingIdx = allApps.findIndex((a) => a.id === updated.id);
    if (existingIdx >= 0) {
      allApps[existingIdx] = updated;
    }
    saveStoredApplications(allApps);

    setSelectedApp(updated);
    setIsResubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-md border border-blue-100 dark:border-blue-900">
            Student Application Tracking Portal
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('trackingPortalTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            {t('trackingPortalSub')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('enterAppIdPlaceholder')}
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-sm cursor-pointer shrink-0"
            >
              {t('trackBtn')}
            </button>
          </form>

          {/* Scrutiny Reference Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Records:</span>
            {[
              { id: 'EVA-2026-0001', label: 'EVA-2026-0001 (Approved)' },
              { id: 'EVA-2026-0002', label: 'EVA-2026-0002 (Manual Review)' },
              { id: 'EVA-2026-0003', label: 'EVA-2026-0003 (Correction Requested)' },
              { id: 'EVA-2026-0101', label: 'EVA-2026-0101 (Approved · 2025)' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setSearchQuery(chip.id);
                  const app = getApplicationById(chip.id);
                  if (app) setSelectedApp(app);
                  setIsResubmitted(false);
                }}
                className={`font-mono px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                  selectedApp?.id === chip.id
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {selectedApp ? (
          <div className="space-y-8">
            {/* Application Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                    {selectedApp.id}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedApp.collegeName} (Code: {selectedApp.collegeCode})
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedApp.personal.fullName}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span>Department: <strong>{selectedApp.preferences.firstChoice}</strong></span>
                  <span>Cutoff: <strong>{selectedApp.twelfth.engineeringCutoff.toFixed(2)}</strong></span>
                  <span>Quota: <strong>{selectedApp.preferences.admissionType}</strong></span>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => generateFormalApplicationPdf(selectedApp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download as PDF</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-1 shrink-0">
                <span className="text-xs text-slate-400">Live Scrutiny Status:</span>
                <span
                  className={`text-xs font-extrabold px-3 py-1.5 rounded-xl font-mono uppercase ${
                    selectedApp.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : selectedApp.status === 'CORRECTION_REQUESTED'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      : selectedApp.status === 'MANUAL_REVIEW'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : selectedApp.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {selectedApp.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-slate-400">
                  Updated: {new Date(selectedApp.lastUpdatedDate).toLocaleString()}
                </span>
              </div>
            </div>

            {/* SPECIAL INNOVATION 3: SMART CORRECTION ASSISTANT */}
            {selectedApp.status === 'CORRECTION_REQUESTED' && selectedApp.correctionRequest && (
              <div className="bg-amber-50/90 rounded-2xl border-2 border-amber-300 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <RotateCcw className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                      Action Required · Smart Correction Assistant
                    </span>
                    <h3 className="text-lg font-bold text-amber-950">
                      Admission Officer Requested Clarification / Document Replacement
                    </h3>
                    <p className="text-xs text-amber-900 leading-relaxed pt-1">
                      {selectedApp.correctionRequest.instructions}
                    </p>
                  </div>
                </div>

                {/* Fields to Correct Interactive Form */}
                <div className="bg-white rounded-xl p-5 border border-amber-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Correct Specified Inconsistencies:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        10th Secondary School Name (Verified with certificate)
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedApp.tenth.schoolName}
                        onChange={(e) =>
                          setCorrectionFieldValues((prev) => ({
                            ...prev,
                            schoolName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        10th Transfer Certificate Number
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedApp.tenth.tcNumber}
                        onChange={(e) =>
                          setCorrectionFieldValues((prev) => ({
                            ...prev,
                            tenthTcNumber: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      Replace Document Scan (Optional):
                    </span>
                    <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shadow-xs">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Choose Replacement File (PDF / JPG)</span>
                      <input type="file" className="sr-only" />
                    </label>
                    <span className="text-[11px] text-slate-500 block">
                      File will be immediately re-processed through the OCR layout parser.
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleResubmitCorrection}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Resubmit for Verification</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isResubmitted && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Corrections successfully resubmitted! Application transitioned back to preliminary scrutiny queue.
                </span>
              </div>
            )}

            {/* Visual Progress Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900">
                Application Scrutiny Progress Timeline
              </h3>

              <div className="space-y-6">
                {timelineSteps.map((step, idx) => {
                  const status = getStepStatus(idx, selectedApp.status);

                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : status === 'action_needed'
                              ? 'bg-amber-600 text-white ring-4 ring-amber-100 animate-pulse'
                              : status === 'current'
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        {idx < timelineSteps.length - 1 && (
                          <div
                            className={`w-0.5 h-12 my-1 ${
                              status === 'completed' ? 'bg-emerald-600' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>

                      <div className="space-y-0.5 pt-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              status === 'completed'
                                ? 'text-slate-900'
                                : status === 'action_needed'
                                ? 'text-amber-900 font-extrabold'
                                : status === 'current'
                                ? 'text-blue-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </h4>
                          {status === 'action_needed' && (
                            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{step.subtext}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Audit Log History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Auditable Action Trail ({selectedApp.auditTrail.length})</span>
              </div>

              <div className="divide-y divide-slate-100">
                {selectedApp.auditTrail.map((log) => (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          {log.actor}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{log.details}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold">Enter an Application ID above to track status.</p>
          </div>
        )}
      </div>
    </div>
  );
};
