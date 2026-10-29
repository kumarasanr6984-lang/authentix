/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ScanText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileText,
  Save,
  Check,
} from 'lucide-react';
import { UploadedDocItem, StudentApplication } from '../types/admissions';
import { createDefaultOcrPayloadForDoc, generateRawOcrText } from '../services/ocrExtractionService';

interface OcrDocumentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  docKey: string;
  docTitle: string;
  doc: UploadedDocItem;
  application: StudentApplication;
  onSavePayload: (docKey: string, newPayload: Record<string, string | number>, newDocName?: string) => void;
}

interface EditableField {
  key: string;
  label: string;
  formValue: string;
  extractedValue: string;
}

export const OcrDocumentInspectorModal: React.FC<OcrDocumentInspectorModalProps> = ({
  isOpen,
  onClose,
  docKey,
  docTitle,
  doc,
  application,
  onSavePayload,
}) => {
  const [fields, setFields] = useState<EditableField[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize fields on open
  useEffect(() => {
    if (!isOpen) return;

    const payload = doc.mockDataPayload || createDefaultOcrPayloadForDoc(docKey, application, false);
    const generatedFields: EditableField[] = [];

    // Map fields according to document key
    if (docKey === 'aadhaarCard') {
      generatedFields.push({
        key: 'name',
        label: 'Candidate Name',
        formValue: application.personal.fullName || '',
        extractedValue: String(payload.name || doc.extractedName || ''),
      });
      generatedFields.push({
        key: 'dob',
        label: 'Date of Birth (YYYY-MM-DD)',
        formValue: application.personal.dob || '',
        extractedValue: String(payload.dob || ''),
      });
      generatedFields.push({
        key: 'aadhaarNumber',
        label: 'Aadhaar UID Number',
        formValue: application.certificates.aadhaarNumber || '',
        extractedValue: String(payload.aadhaarNumber || ''),
      });
    } else if (docKey === 'tenthMarksheet') {
      generatedFields.push({
        key: 'studentName',
        label: 'Candidate Name',
        formValue: application.personal.fullName || '',
        extractedValue: String(payload.studentName || doc.extractedName || ''),
      });
      generatedFields.push({
        key: 'registerNumber',
        label: '10th Board Register Number',
        formValue: application.tenth.registerNumber || '',
        extractedValue: String(payload.registerNumber || ''),
      });
      generatedFields.push({
        key: 'schoolName',
        label: 'School Institution Name',
        formValue: application.tenth.schoolName || '',
        extractedValue: String(payload.schoolName || ''),
      });
      generatedFields.push({
        key: 'totalMarks',
        label: 'Total Marks (Out of 500)',
        formValue: String(application.tenth.totalMarks || ''),
        extractedValue: String(payload.totalMarks ?? ''),
      });
    } else if (docKey === 'twelfthMarksheet') {
      generatedFields.push({
        key: 'studentName',
        label: 'Candidate Name',
        formValue: application.personal.fullName || '',
        extractedValue: String(payload.studentName || doc.extractedName || ''),
      });
      generatedFields.push({
        key: 'registerNumber',
        label: '12th HSC Register Number',
        formValue: application.twelfth.registerNumber || '',
        extractedValue: String(payload.registerNumber || ''),
      });
      generatedFields.push({
        key: 'mathsMarks',
        label: 'Mathematics Marks (Max 100)',
        formValue: String(application.twelfth.mathsMarks || ''),
        extractedValue: String(payload.mathsMarks ?? ''),
      });
      generatedFields.push({
        key: 'physicsMarks',
        label: 'Physics Marks (Max 100)',
        formValue: String(application.twelfth.physicsMarks || ''),
        extractedValue: String(payload.physicsMarks ?? ''),
      });
      generatedFields.push({
        key: 'chemistryMarks',
        label: 'Chemistry Marks (Max 100)',
        formValue: String(application.twelfth.chemistryMarks || ''),
        extractedValue: String(payload.chemistryMarks ?? ''),
      });
    } else if (docKey === 'communityCert') {
      generatedFields.push({
        key: 'category',
        label: 'Community Category',
        formValue: application.specialCategory.community || '',
        extractedValue: String(payload.category || ''),
      });
      generatedFields.push({
        key: 'certNumber',
        label: 'Certificate Reference Number',
        formValue: application.certificates.communityCertNumber || '',
        extractedValue: String(payload.certNumber || ''),
      });
    } else if (docKey === 'incomeCert') {
      generatedFields.push({
        key: 'certNumber',
        label: 'Income Certificate Number',
        formValue: application.certificates.incomeCertNumber || '',
        extractedValue: String(payload.certNumber || ''),
      });
      generatedFields.push({
        key: 'annualIncome',
        label: 'Family Annual Income',
        formValue: 'Within scholarship ceiling',
        extractedValue: String(payload.annualIncome || ''),
      });
    } else if (docKey === 'tenthTc' || docKey === 'twelfthTc') {
      const tcNumber = docKey === 'tenthTc' ? application.tenth.tcNumber : application.twelfth.tcNumber;
      const school = docKey === 'tenthTc' ? application.tenth.schoolName : application.twelfth.schoolName;
      generatedFields.push({
        key: 'tcNumber',
        label: 'Transfer Certificate Number',
        formValue: tcNumber || '',
        extractedValue: String(payload.tcNumber || tcNumber || ''),
      });
      generatedFields.push({
        key: 'schoolName',
        label: 'Relieving Institution Name',
        formValue: school || '',
        extractedValue: String(payload.schoolName || school || ''),
      });
    } else {
      // Generic fallback
      for (const [k, v] of Object.entries(payload)) {
        generatedFields.push({
          key: k,
          label: k.charAt(0).toUpperCase() + k.slice(1),
          formValue: 'Declared in application',
          extractedValue: String(v),
        });
      }
    }

    setFields(generatedFields);
    setSavedSuccess(false);
  }, [isOpen, docKey, doc, application]);

  if (!isOpen) return null;

  const handleFieldValueChange = (key: string, val: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, extractedValue: val } : f))
    );
  };

  const handleResetToMatchForm = () => {
    setFields((prev) =>
      prev.map((f) => ({
        ...f,
        extractedValue: f.formValue && f.formValue !== 'Declared in application' && f.formValue !== 'Within scholarship ceiling'
          ? f.formValue
          : f.extractedValue,
      }))
    );
  };

  const handleSimulateDiscrepancy = () => {
    const discPayload = createDefaultOcrPayloadForDoc(docKey, application, true);
    setFields((prev) =>
      prev.map((f) => {
        if (f.key in discPayload) {
          return { ...f, extractedValue: String(discPayload[f.key]) };
        }
        return f;
      })
    );
  };

  const handleSave = () => {
    const updatedPayload: Record<string, string | number> = {};
    let candidateName: string | undefined;

    for (const f of fields) {
      if (f.key === 'totalMarks' || f.key === 'mathsMarks' || f.key === 'physicsMarks' || f.key === 'chemistryMarks') {
        const num = parseFloat(f.extractedValue);
        updatedPayload[f.key] = isNaN(num) ? f.extractedValue : num;
      } else {
        updatedPayload[f.key] = f.extractedValue;
      }

      if (f.key === 'name' || f.key === 'studentName' || f.key === 'childName') {
        candidateName = f.extractedValue;
      }
    }

    onSavePayload(docKey, updatedPayload, candidateName);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 transition-colors">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ScanText className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-200 block">
                OCR Optical Character Recognition
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{docTitle}</span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Sub-banner */}
        <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-950 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Extracts document information using OCR, compares with form entries, and verifies matches or differences.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToMatchForm}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
              title="Sets all extracted document fields to match the application form exactly"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Match Form (100% Pass)</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleSimulateDiscrepancy}
              className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
              title="Introduces realistic discrepancies to test mismatch detection"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Discrepancy</span>
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            File attached: <strong className="font-mono text-slate-800 dark:text-slate-200">{doc.name}</strong> ({doc.fileSize})
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Document Field</th>
                  <th className="py-3 px-4">Entered in Form</th>
                  <th className="py-3 px-4">OCR Extracted from Document</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {fields.map((f) => {
                  const isCleanMatch =
                    f.formValue &&
                    f.formValue !== 'Declared in application' &&
                    f.formValue !== 'Within scholarship ceiling' &&
                    f.formValue.trim().toLowerCase() === f.extractedValue.trim().toLowerCase();

                  return (
                    <tr key={f.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {f.label}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {f.formValue || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={f.extractedValue}
                          onChange={(e) => handleFieldValueChange(f.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCleanMatch ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>MATCH</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>DIFFER</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Raw OCR Text Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Simulated Raw OCR Optical Character Recognition Stream:
            </span>
            <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {generateRawOcrText(docKey, doc.mockDataPayload || {})}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Click &apos;Save OCR Data&apos; to apply changes to this document&apos;s extraction payload.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save OCR Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
