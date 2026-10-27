/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Download,
  Search,
  School,
  FileCheck,
  Calendar,
  User,
  ShieldAlert,
  FileText,
  Check,
  Award,
  Hash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudentApplication } from '../types/admissions';
import { maskAadhaar } from '../services/verificationEngine';
import { generateFormalApplicationPdf } from '../services/formalPdfGenerator';
import { useThemeLanguage } from '../context/ThemeLanguageContext.tsx';

interface SubmissionSuccessProps {
  application: StudentApplication;
  onTrackApplication: () => void;
  onReturnToCollege: () => void;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({
  application,
  onTrackApplication,
  onReturnToCollege,
}) => {
  const { t } = useThemeLanguage();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showDataSummary, setShowDataSummary] = useState(false);

  // Fire confetti celebration on load
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#1d4ed8', '#38bdf8', '#059669', '#f59e0b'],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleDownloadPdf = () => {
    try {
      generateFormalApplicationPdf(application);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating formal PDF application:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-6 transition-colors">
        
        {/* Success Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mx-auto flex items-center justify-center text-white shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-sky-200 block">
            Application Submission Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('appSuccessTitle')}
          </h1>
          <p className="text-xs text-sky-100 max-w-lg mx-auto leading-relaxed">
            Your admission dossier has been validated by the Authentix Scrutiny Engine and submitted to the institutional admissions cell of {application.collegeName}.
          </p>
        </div>

        <div className="px-6 sm:px-8 space-y-5">
          {/* Core Credentials Highlight Card */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Application Reference ID:
              </span>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-sm bg-blue-50 dark:bg-blue-950/70 px-3 py-1 rounded-md border border-blue-200 dark:border-blue-800 shadow-xs">
                {application.id}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Candidate Full Name:
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{application.personal.fullName}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Target Institution:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {application.collegeName} ({application.collegeCode})
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Submission Timestamp:
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {new Date(application.submissionDate).toLocaleString()}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Preliminary Status:
              </span>
              <span className="font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] border border-emerald-200 dark:border-emerald-800">
                {application.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Engineering Cutoff & 1st Choice:
              </span>
              <div className="text-right">
                <span className="font-bold text-blue-700 dark:text-blue-300 mr-2">
                  {application.twelfth.engineeringCutoff.toFixed(2)} / 200
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  ({application.preferences.firstChoice})
                </span>
              </div>
            </div>
          </div>

          {/* Dedicated Formal PDF Generation Banner */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/90 dark:to-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Formal Admission Application Document</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      2 Pages · DOTE Format
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Generates a formal, printable PDF docket containing all your personal details, guardian particulars, 10th & 12th marks, STEM cutoff, branch choices, masked Aadhaar, and scrutiny audit.
                  </p>
                </div>
              </div>

              {/* PRIMARY 'Download as PDF' BUTTON */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                id="download-as-pdf-btn"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download as PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick summary toggle */}
            <div className="pt-2 border-t border-blue-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                Includes statutory declarations & official verification seal · Official portal: https://authentix-edu.in
              </span>
              <button
                type="button"
                onClick={() => setShowDataSummary(!showDataSummary)}
                className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                <span>{showDataSummary ? 'Hide Summary' : 'View Data Summary'}</span>
                {showDataSummary ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Expandable Data Summary */}
            {showDataSummary && (
              <div className="pt-3 mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-fadeIn">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Personal & Family:</span>
                  <p className="text-slate-600 dark:text-slate-400">Name: {application.personal.fullName} ({application.personal.gender})</p>
                  <p className="text-slate-600 dark:text-slate-400">DOB: {application.personal.dob} ({application.personal.calculatedAge} Yrs)</p>
                  <p className="text-slate-600 dark:text-slate-400">Parents: {application.personal.fatherName} & {application.personal.motherName}</p>
                  <p className="text-slate-600 dark:text-slate-400">Contact: {application.personal.mobile} · {application.personal.email}</p>
                  <p className="text-slate-600 dark:text-slate-400">Address: {application.personal.district}, {application.personal.state} - {application.personal.pinCode}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Academic & Preferences:</span>
                  <p className="text-slate-600 dark:text-slate-400">10th Aggregate: {application.tenth.totalMarks}/{application.tenth.maximumMarks} ({application.tenth.percentage}%)</p>
                  <p className="text-slate-600 dark:text-slate-400">12th Stream: {application.twelfth.subjectGroup}</p>
                  <p className="text-slate-600 dark:text-slate-400">STEM Marks: M: {application.twelfth.mathsMarks}, P: {application.twelfth.physicsMarks}, C: {application.twelfth.chemistryMarks}</p>
                  <p className="text-slate-600 dark:text-slate-400">Cutoff: {application.twelfth.engineeringCutoff.toFixed(2)}/200</p>
                  <p className="text-slate-600 dark:text-slate-400">Preferences: 1st {application.preferences.firstChoice}, 2nd {application.preferences.secondChoice}</p>
                  <p className="text-slate-600 dark:text-slate-400">Masked UID: {maskAadhaar(application.certificates.aadhaarNumber)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Statutory Notice */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="block text-amber-950 dark:text-amber-200 font-bold">Important Admission Notice:</strong>
              Submission through the preliminary AI portal does not constitute final irreversible admission approval. The institutional admissions officer will scrutinize verified records and confirm final branch allocation.
            </p>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download as PDF</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onTrackApplication}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-blue-800 dark:text-blue-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t('trackYourApp')}</span>
            </button>
            <button
              type="button"
              onClick={onReturnToCollege}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              <span>Return to College</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
