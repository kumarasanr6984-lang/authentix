/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  X,
  Edit2,
  Check,
  ScanText,
  AlertTriangle,
} from 'lucide-react';
import { StudentApplication, UploadedDocItem } from '../types/admissions';
import { createSampleVerificationDocs } from '../services/sampleDocs';
import { useThemeLanguage } from '../context/ThemeLanguageContext.tsx';
import { extractDocumentName, verifyStudentName } from '../services/nameVerificationService';
import { NameVerificationModal } from './NameVerificationModal';
import {
  processUploadedFileWithOcr,
  createDiscrepantSampleVerificationDocs,
} from '../services/ocrExtractionService';
import { OcrDocumentInspectorModal } from './OcrDocumentInspectorModal';

interface DocumentUploadProps {
  application: StudentApplication;
  onUpdateDocs: (docs: Record<string, UploadedDocItem | null>) => void;
  onUpdateApplication?: (app: StudentApplication) => void;
  onStartVerification: () => void;
  onBack: () => void;
}

interface DocSlotConfig {
  key: string;
  title: string;
  description: string;
  required: boolean;
  acceptedFormats: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  application,
  onUpdateDocs,
  onUpdateApplication,
  onStartVerification,
  onBack,
}) => {
  const { t } = useThemeLanguage();
  const [docs, setDocs] = useState<Record<string, UploadedDocItem | null>>(
    application.documents || {}
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewDoc, setPreviewDoc] = useState<{ title: string; doc: UploadedDocItem } | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [sampleSuccessToast, setSampleSuccessToast] = useState(false);
  const [discrepancyToast, setDiscrepancyToast] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [editingDocKey, setEditingDocKey] = useState<string | null>(null);
  const [editingDocValue, setEditingDocValue] = useState<string>('');
  const [inspectingDocKey, setInspectingDocKey] = useState<string | null>(null);

  const docSlots: DocSlotConfig[] = [
    {
      key: 'aadhaarCard',
      title: 'Aadhaar Card (UIDAI)',
      description: 'Front and back scan. UID numbers are automatically masked during verification.',
      required: true,
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
    {
      key: 'communityCert',
      title: 'Community Certificate',
      description:
        application.specialCategory.community === 'OC'
          ? 'Not mandatory for Open Competition (OC/General) category applicants.'
          : 'Mandatory Revenue Department caste certificate for reservation eligibility.',
      required: application.specialCategory.community !== 'OC',
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
    {
      key: 'incomeCert',
      title: 'Income Certificate',
      description:
        application.preferences.admissionType === 'Management'
          ? 'Optional for Institutional Management Quota (Government tuition fee concessions & state scholarships apply only to Counselling).'
          : 'Issued by Zonal Tahsildar for tuition fee concession and government scholarships.',
      required: application.preferences.admissionType !== 'Management',
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
    {
      key: 'tenthMarksheet',
      title: 'Tenth Standard Marksheet (SSLC)',
      description: 'Used for age proof, candidate spelling cross-reference, and secondary qualification.',
      required: true,
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
    {
      key: 'tenthTc',
      title: 'Tenth Transfer Certificate (TC)',
      description: 'Issued by relieving school certifying continuous conduct and school affiliation.',
      required: true,
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
    {
      key: 'twelfthMarksheet',
      title: 'Twelfth Standard Marksheet (HSC)',
      description: application.twelfth.isExpectedMarks
        ? 'Optional: Applicant marked status as awaiting official results.'
        : 'Higher secondary marksheet for STEM cutoff and AICTE aggregate verification.',
      required: !application.twelfth.isExpectedMarks,
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
    {
      key: 'twelfthTc',
      title: 'Twelfth Transfer Certificate (TC)',
      description: 'Optional if provisional or awaited from junior college/higher secondary school.',
      required: false,
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
    {
      key: 'birthCert',
      title: 'Birth Certificate',
      description: 'Municipal Corporation or Panchayat certificate verifying formal legal date of birth.',
      required: true,
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
    {
      key: 'photo',
      title: 'Passport-Size Photograph',
      description: 'Recent colored photograph with clean neutral background (3.5 x 4.5 cm).',
      required: true,
      acceptedFormats: 'JPG, JPEG, PNG (Max 10MB)',
    },
    {
      key: 'specialCategory',
      title: 'Special-Category / Migration Certificate',
      description:
        application.preferences.admissionType !== 'Management' && application.specialCategory.isGovtSchoolQuota
          ? 'Tamil Nadu 7.5% Govt School 6th-12th Bonafide Certificate.'
          : application.specialCategory.hasDisability === 'Yes'
          ? 'Medical Board Disability Certificate.'
          : 'Migration certificate for applicants outside state boards (if applicable).',
      required:
        (application.preferences.admissionType !== 'Management' && application.specialCategory.isGovtSchoolQuota) ||
        application.specialCategory.hasDisability === 'Yes',
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)',
    },
  ];

  const handleFileUpload = async (key: string, file: File) => {
    setErrorMessage('');
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File "${file.name}" exceeds the 10 MB limit.`);
      return;
    }

    // Simulate upload progress
    setUploadProgress((prev) => ({ ...prev, [key]: 15 }));
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[key] || 15;
        if (current >= 90) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, [key]: current + 25 };
      });
    }, 70);

    try {
      const processedDoc = await processUploadedFileWithOcr(file, key, application);
      clearInterval(interval);
      setUploadProgress((prev) => ({ ...prev, [key]: 100 }));

      setTimeout(() => {
        const updated = { ...docs, [key]: processedDoc };
        setDocs(updated);
        onUpdateDocs(updated);
        setUploadProgress((prev) => {
          const clone = { ...prev };
          delete clone[key];
          return clone;
        });
      }, 200);
    } catch {
      clearInterval(interval);
      setErrorMessage(`Error running OCR on "${file.name}".`);
      setUploadProgress((prev) => {
        const clone = { ...prev };
        delete clone[key];
        return clone;
      });
    }
  };

  const handleRemove = (key: string) => {
    const updated = { ...docs, [key]: null };
    setDocs(updated);
    onUpdateDocs(updated);
  };

  const handleSaveOcrPayload = (
    slotKey: string,
    newPayload: Record<string, string | number>,
    newDocName?: string
  ) => {
    const target = docs[slotKey];
    if (!target) return;
    const updated = {
      ...docs,
      [slotKey]: {
        ...target,
        mockDataPayload: newPayload,
        extractedName: newDocName || target.extractedName,
      },
    };
    setDocs(updated);
    onUpdateDocs(updated);
  };

  const handleLoadSampleDocuments = () => {
    const sampleDocs = createSampleVerificationDocs(application);
    setDocs(sampleDocs);
    onUpdateDocs(sampleDocs);
    setErrorMessage('');
    setSampleSuccessToast(true);
    setTimeout(() => setSampleSuccessToast(false), 3500);
  };

  const handleLoadDiscrepantDocuments = () => {
    const discDocs = createDiscrepantSampleVerificationDocs(application);
    setDocs(discDocs);
    onUpdateDocs(discDocs);
    setErrorMessage('');
    setDiscrepancyToast(true);
    setTimeout(() => setDiscrepancyToast(false), 4000);
  };

  const handleLoadNameTestScenario = (
    formName: string,
    docName: string,
    isUnreadable: boolean = false
  ) => {
    // 1. Update applicant full name
    const updatedApp: StudentApplication = {
      ...application,
      personal: {
        ...application.personal,
        fullName: formName,
      },
    };

    // 2. Generate sample docs with matching base data
    const sampleDocs = createSampleVerificationDocs(updatedApp);

    if (isUnreadable) {
      if (sampleDocs.aadhaarCard) {
        sampleDocs.aadhaarCard.name = 'Corrupted_Unreadable_Aadhaar.pdf';
        sampleDocs.aadhaarCard.extractedName = '';
        if (sampleDocs.aadhaarCard.mockDataPayload) {
          delete sampleDocs.aadhaarCard.mockDataPayload.name;
        }
      }
      if (sampleDocs.tenthMarksheet) {
        sampleDocs.tenthMarksheet.extractedName = '';
        if (sampleDocs.tenthMarksheet.mockDataPayload) {
          delete sampleDocs.tenthMarksheet.mockDataPayload.studentName;
        }
      }
    } else {
      if (sampleDocs.aadhaarCard) {
        sampleDocs.aadhaarCard.extractedName = docName;
        sampleDocs.aadhaarCard.name = `Aadhaar_${docName.replace(/\s+/g, '_')}.pdf`;
        if (sampleDocs.aadhaarCard.mockDataPayload) {
          sampleDocs.aadhaarCard.mockDataPayload.name = docName;
        }
      }
      if (sampleDocs.tenthMarksheet) {
        sampleDocs.tenthMarksheet.extractedName = docName;
        sampleDocs.tenthMarksheet.name = `10th_Marksheet_${docName.replace(/\s+/g, '_')}.pdf`;
        if (sampleDocs.tenthMarksheet.mockDataPayload) {
          sampleDocs.tenthMarksheet.mockDataPayload.studentName = docName;
        }
      }
    }

    updatedApp.documents = sampleDocs;
    setDocs(sampleDocs);
    onUpdateDocs(sampleDocs);
    if (onUpdateApplication) {
      onUpdateApplication(updatedApp);
    }
    setErrorMessage('');
    setSampleSuccessToast(true);
    setTimeout(() => setSampleSuccessToast(false), 3500);
  };

  const handleSaveDocName = (key: string) => {
    const targetDoc = docs[key];
    if (!targetDoc) return;
    const trimmed = editingDocValue.trim();
    const updatedDoc: UploadedDocItem = {
      ...targetDoc,
      extractedName: trimmed || undefined,
      mockDataPayload: {
        ...(targetDoc.mockDataPayload || {}),
        name: trimmed,
        studentName: trimmed,
      },
    };
    const updated = { ...docs, [key]: updatedDoc };
    setDocs(updated);
    onUpdateDocs(updated);
    setEditingDocKey(null);
  };

  const handleProceed = () => {
    // Check required docs
    const missingRequired = docSlots.filter((slot) => slot.required && !docs[slot.key]);
    if (missingRequired.length > 0) {
      setErrorMessage(
        `Please upload all mandatory documents before triggering verification: ${missingRequired
          .map((s) => s.title)
          .join(', ')}.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onStartVerification();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <span>Step 2 of 4</span>
              <span>·</span>
              <span>Document Repository Scrutiny</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              {t('uploadVerificationDocs')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('uploadDocsSub')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Demo Preload Button - Matching */}
            <button
              type="button"
              onClick={handleLoadSampleDocuments}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/70 border border-emerald-300 dark:border-emerald-700/60 rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-sm active:scale-95"
              title="Loads certified sample documents where all details match the form"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Load Matching Documents</span>
            </button>

            {/* Quick Demo Preload Button - Discrepancies */}
            <button
              type="button"
              onClick={handleLoadDiscrepantDocuments}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-700/60 rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-sm active:scale-95"
              title="Loads sample documents with deliberate discrepancies to test mismatch detection"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Test Discrepant Documents</span>
            </button>
          </div>
        </div>

        {/* Feature Banner: Document Verification Using OCR */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <ScanText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Document Verification Using OCR
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  The system extracts information from uploaded documents using Optical Character Recognition (OCR), compares extracted details with information entered in the application form, and verifies whether the details match or differ.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-blue-100 dark:border-blue-900/50 text-[11px]">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span>1. Extract OCR Tokens &amp; Metadata</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>2. Field-by-Field Exact &amp; Fuzzy Comparison</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span>3. Verify &amp; Report Matches / Differences</span>
            </div>
          </div>
        </div>

        {/* Sample Documents Success Toast */}
        {sampleSuccessToast && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>100% Matching verification documents loaded! All OCR extracted fields correspond to form entries.</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-md">
              ✓ Ready to Verify
            </span>
          </div>
        )}

        {/* Discrepancy Scenario Loaded Toast */}
        {discrepancyToast && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Discrepant scenario loaded! Intentional differences in Name, DOB, 10th &amp; 12th marks, and Category attached. Run verification to see OCR flag differences!</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-md">
              ⚠ Test Discrepancies
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docSlots.map((slot) => {
            const uploaded = docs[slot.key];
            const progress = uploadProgress[slot.key];

            return (
              <div
                key={slot.key}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                  uploaded
                    ? 'border-emerald-200 dark:border-emerald-800/80 ring-1 ring-emerald-500/20'
                    : slot.required
                    ? 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{slot.title}</h3>
                        {slot.required ? (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{slot.description}</p>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      {uploaded ? (
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Upload className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {progress !== undefined && (
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Uploading file...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-150"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Uploaded File Details / Success Badge */}
                  {uploaded && progress === undefined && (
                    <div className="mt-4 p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold truncate max-w-[220px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{uploaded.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          {uploaded.fileSize}
                        </span>
                      </div>

                      {/* OCR Extracted Candidate Name Row with Inline Edit */}
                      <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
                            <span>Extracted Document Name (OCR):</span>
                          </span>
                          {editingDocKey === slot.key ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveDocName(slot.key)}
                                className="px-2 py-0.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingDocKey(null)}
                                className="px-2 py-0.5 text-[10px] text-slate-600 hover:text-slate-800 dark:text-slate-400 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDocKey(slot.key);
                                setEditingDocValue(
                                  uploaded.extractedName ||
                                  (uploaded.mockDataPayload?.name as string) ||
                                  (uploaded.mockDataPayload?.studentName as string) ||
                                  ''
                                );
                              }}
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit Name</span>
                            </button>
                          )}
                        </div>

                        {editingDocKey === slot.key ? (
                          <div className="pt-1">
                            <input
                              type="text"
                              value={editingDocValue}
                              onChange={(e) => setEditingDocValue(e.target.value)}
                              placeholder="Type name extracted from document..."
                              className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                              autoFocus
                            />
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Leave empty to test &apos;Unable to Verify&apos; result.
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-blue-900 dark:text-blue-300 bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/60">
                              {uploaded.extractedName ||
                                (uploaded.mockDataPayload?.name as string) ||
                                (uploaded.mockDataPayload?.studentName as string) ||
                                '— [Unreadable / Text Occluded]'}
                            </span>
                            {!(
                              uploaded.extractedName ||
                              uploaded.mockDataPayload?.name ||
                              uploaded.mockDataPayload?.studentName
                            ) && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                                OCR Incomplete
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {slot.acceptedFormats}
                  </span>

                  <div className="flex items-center gap-2">
                    {uploaded ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setInspectingDocKey(slot.key)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Inspect and edit OCR extracted field values"
                        >
                          <ScanText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>OCR Data</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ title: slot.title, doc: uploaded })}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <label className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(slot.key, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemove(slot.key)}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Remove File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <label className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Add File</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(slot.key, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToAppForm')}</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            className="flex items-center gap-2 px-8 py-3 text-xs font-extrabold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-700/25 active:scale-[0.99] transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('verifyDocumentsCTA')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{previewDoc.doc.name}</span>
                  <span className="font-mono">{previewDoc.doc.fileSize}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Uploaded on {previewDoc.doc.uploadDate} · Format: {previewDoc.doc.type}
                </p>
              </div>

              {previewDoc.doc.mockDataPayload && (
                <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                    OCR Extracted Text Tokens & Metadata:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700">
                    {Object.entries(previewDoc.doc.mockDataPayload).map(([k, v]) => (
                      <div key={k} className="p-2 bg-white rounded border border-blue-200/60">
                        <span className="text-[10px] text-slate-400 block uppercase">{k}</span>
                        <span className="font-bold text-slate-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Render image preview if available */}
              {previewDoc.doc.previewUrl ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center p-2">
                  <img
                    src={previewDoc.doc.previewUrl}
                    alt={previewDoc.doc.name}
                    className="max-h-80 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300" />
                  <span className="text-xs font-medium">Digital PDF Document Scanned Successfully</span>
                  <span className="text-[11px] font-mono text-slate-400">Cryptographic hash verified</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intelligent Name Verification & OCR Inspector Modal */}
      <NameVerificationModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        initialFormName={application.personal.fullName || 'R. Kumar'}
        initialDocName={
          docs.aadhaarCard?.extractedName ||
          (docs.aadhaarCard?.mockDataPayload?.name as string) ||
          'Kumar R'
        }
      />

      {/* Field-by-Field OCR Document Inspector & Editor Modal */}
      {inspectingDocKey && docs[inspectingDocKey] && (
        <OcrDocumentInspectorModal
          isOpen={true}
          onClose={() => setInspectingDocKey(null)}
          docKey={inspectingDocKey}
          docTitle={docSlots.find((s) => s.key === inspectingDocKey)?.title || inspectingDocKey}
          doc={docs[inspectingDocKey]!}
          application={application}
          onSavePayload={handleSaveOcrPayload}
        />
      )}
    </div>
  );
};
