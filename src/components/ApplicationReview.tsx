/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  User,
  GraduationCap,
  Award,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
} from 'lucide-react';
import { StudentApplication, CollegeInfo } from '../types/admissions';
import { maskAadhaar } from '../services/verificationEngine';
import { useThemeLanguage } from '../context/ThemeLanguageContext.tsx';

interface ApplicationReviewProps {
  application: StudentApplication;
  college: CollegeInfo;
  onSubmit: () => void;
  onBackToVerification: () => void;
}

export const ApplicationReview: React.FC<ApplicationReviewProps> = ({
  application,
  college,
  onSubmit,
  onBackToVerification,
}) => {
  const { t } = useThemeLanguage();
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');

  const summary = application.verificationSummary;

  const handleSubmitClick = () => {
    if (!agreeDeclaration) {
      setErrorNotice('Please accept the declaration confirming accuracy of uploaded credentials.');
      return;
    }
    onSubmit();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <span>Step 4 of 4</span>
            <span>·</span>
            <span>Comprehensive Review & Formal Submission</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {t('dossierReview')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Please examine your finalized admission profile prior to administrative routing.
          </p>
        </div>

        {errorNotice && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Preliminary Scrutiny Summary Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Automated Preliminary Scrutiny
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {summary?.overallStatus === 'PASSED'
                  ? 'All Academic & Identity Invariants Cleared'
                  : summary?.overallStatus === 'MANUAL_REVIEW_REQUIRED'
                  ? 'Ready for Administrative Manual Inspection'
                  : 'Submitted with Document Inconsistencies'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Institution: <strong className="text-slate-800">{college.name} ({college.code})</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Engineering Cutoff</span>
            <span className="text-2xl font-extrabold font-mono text-blue-800 tabular-nums">
              {application.twelfth.engineeringCutoff.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block">/ 200.00</span>
          </div>
        </div>

        {/* Section Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Bio Data */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Personal Identification</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Full Name:</span>
                <span className="font-bold text-slate-900">{application.personal.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Date of Birth (Age):</span>
                <span className="font-semibold text-slate-800">
                  {application.personal.dob} ({application.personal.calculatedAge} yrs)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Gender:</span>
                <span className="text-slate-800">{application.personal.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Community:</span>
                <span className="font-semibold text-blue-800">{application.specialCategory.community}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mobile:</span>
                <span className="font-mono text-slate-800">{application.personal.mobile}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Masked Aadhaar:</span>
                <span className="font-mono text-slate-800">
                  {maskAadhaar(application.certificates.aadhaarNumber)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Address:</span>
                <span className="text-slate-800">
                  {application.personal.address}, {application.personal.district} - {application.personal.pinCode}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Academic Performance</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">10th Board:</span>
                <span className="text-slate-800">{application.tenth.board}</span>
              </div>
              <div>
                <span className="text-slate-400 block">10th Aggregate:</span>
                <span className="font-mono font-bold text-slate-900">
                  {application.tenth.totalMarks} / {application.tenth.maximumMarks} ({application.tenth.percentage}%)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">12th Subject Group:</span>
                <span className="text-slate-800">{application.twelfth.subjectGroup}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Status:</span>
                <span className="font-semibold text-slate-800">
                  {application.twelfth.isExpectedMarks ? 'Expected Result' : 'Official Marksheet'}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-1">Core STEM Marks (12th):</span>
                <div className="flex gap-4 font-mono text-xs">
                  <span>Maths: <strong>{application.twelfth.mathsMarks}</strong></span>
                  <span>Physics: <strong>{application.twelfth.physicsMarks}</strong></span>
                  <span>Chemistry: <strong>{application.twelfth.chemistryMarks}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Admission Choices */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Department Choices & Quotas</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Admission Pathway:</span>
                <span className="font-bold text-blue-800">{application.preferences.admissionType} Quota</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-800 font-medium">
                <li>
                  <strong className="text-slate-900">{application.preferences.firstChoice}</strong> (1st Choice)
                </li>
                <li>{application.preferences.secondChoice} (2nd Choice)</li>
                <li>{application.preferences.thirdChoice} (3rd Choice)</li>
              </ol>

              {application.preferences.admissionType !== 'Management' && application.specialCategory.isGovtSchoolQuota && (
                <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-lg text-[11px] text-blue-900 dark:text-blue-300">
                  ✓ Eligible for Tamil Nadu 7.5% Government School Preferential Quota & Fee Waiver Scholarship.
                </div>
              )}
              {application.preferences.admissionType === 'Management' && (
                <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-lg text-[11px] text-amber-900 dark:text-amber-300">
                  ℹ️ Institutional Management Quota (State Government Scholarships & 7.5% Govt School Quota not applicable).
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Documents Scrutiny */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Certificates Enclosed</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {Object.entries(application.documents)
                .filter(([_, doc]) => doc !== null)
                .map(([key, doc]) => (
                  <div key={key} className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{doc?.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{doc?.fileSize}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Candidate Declaration */}
        {/* Declaration Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeDeclaration}
              onChange={(e) => {
                setAgreeDeclaration(e.target.checked);
                setErrorNotice('');
              }}
              className="mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                Applicant Declaration & Consent
              </span>
              I hereby declare that all academic scores, dates of birth, category claims, and uploaded certificate documents submitted are genuine and accurate. I understand that submission here forwards my dossier for administrative verification, and final admission is subject to physical document scrutiny and seat matrix allocation.
            </div>
          </label>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onBackToVerification}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Verification Report</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitClick}
            className="flex items-center gap-2 px-8 py-3 text-xs font-extrabold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-700/25 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{t('submitApplicationCTA')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
