/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Award,
  FileCheck,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Save,
  CheckCircle2,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  StudentApplication,
  CollegeInfo,
  EducationBoard,
  SubjectGroup,
  AdmissionType,
  CommunityCategory,
} from '../types/admissions';
import { DEPARTMENTS_LIST } from '../data/colleges';
import { saveCollegeDraft, clearCollegeDraft, createBlankApplication } from '../services/storage';
import { createSampleVerificationDocs } from '../services/sampleDocs';
import { useThemeLanguage } from '../context/ThemeLanguageContext.tsx';

interface ApplicationFormProps {
  college: CollegeInfo;
  initialApplication: StudentApplication;
  onSaveDraft: (app: StudentApplication) => void;
  onProceedToUpload: (app: StudentApplication) => void;
  onBack: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  college,
  initialApplication,
  onSaveDraft,
  onProceedToUpload,
  onBack,
}) => {
  const { t } = useThemeLanguage();
  const [app, setApp] = useState<StudentApplication>(initialApplication);
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveToast, setSaveToast] = useState(false);
  const [demoToast, setDemoToast] = useState(false);
  const [clearToast, setClearToast] = useState(false);

  // Sync state if initialApplication changes (e.g. user resumed another college from history or started fresh)
  useEffect(() => {
    setApp(initialApplication);
  }, [initialApplication.id, initialApplication.collegeCode]);

  // Auto-calculate Age whenever DOB changes
  useEffect(() => {
    if (app.personal.dob) {
      const birthDate = new Date(app.personal.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setApp((prev) => ({
        ...prev,
        personal: { ...prev.personal, calculatedAge: Math.max(0, age) },
      }));
    }
  }, [app.personal.dob]);

  // Auto-calculate 10th percentage
  useEffect(() => {
    const total = Number(app.tenth.totalMarks) || 0;
    const max = Number(app.tenth.maximumMarks) || 500;
    const pct = max > 0 ? Number(((total / max) * 100).toFixed(2)) : 0;
    setApp((prev) => ({
      ...prev,
      tenth: { ...prev.tenth, percentage: pct },
    }));
  }, [app.tenth.totalMarks, app.tenth.maximumMarks]);

  // Auto-calculate 12th Cutoff: Maths/2 + Physics/4 + Chemistry/4
  // In Tamil Nadu engineering cutoff (max 200):
  // When marks are out of 100: Maths (100) + Physics/2 (50) + Chemistry/2 (50) = 200
  // Or if following exact formula string: (Maths / 2 + Physics / 4 + Chemistry / 4) * 2 = 200 max.
  // We compute the normalized 200-mark cutoff:
  useEffect(() => {
    const m = Number(app.twelfth.mathsMarks) || 0;
    const p = Number(app.twelfth.physicsMarks) || 0;
    const c = Number(app.twelfth.chemistryMarks) || 0;
    const opt = Number(app.twelfth.optionalSubjectMarks) || 0;

    // Engineering Cutoff (Max 200): Mathematics (100 max) + Physics (50 max) + Chemistry (50 max)
    const cutoff = Number((m + p / 2 + c / 2).toFixed(2));
    const total = m + p + c + opt;

    setApp((prev) => ({
      ...prev,
      twelfth: {
        ...prev.twelfth,
        engineeringCutoff: Math.min(200, cutoff),
        expectedTotalMarks: total,
      },
    }));
  }, [
    app.twelfth.mathsMarks,
    app.twelfth.physicsMarks,
    app.twelfth.chemistryMarks,
    app.twelfth.optionalSubjectMarks,
  ]);

  // Sync certificate numbers with 10th and 12th marksheet/TC numbers
  useEffect(() => {
    setApp((prev) => ({
      ...prev,
      certificates: {
        ...prev.certificates,
        tenthMarksheetNumber: prev.tenth.marksheetNumber,
        tenthTcNumber: prev.tenth.tcNumber,
        twelfthMarksheetNumber: prev.twelfth.marksheetNumber || '',
        twelfthTcNumber: prev.twelfth.tcNumber || '',
      },
    }));
  }, [
    app.tenth.marksheetNumber,
    app.tenth.tcNumber,
    app.twelfth.marksheetNumber,
    app.twelfth.tcNumber,
  ]);

  const validateAllSections = (): boolean => {
    const errors: string[] = [];

    // Section A validations
    if (!app.personal.fullName.trim()) errors.push('Student Full Name is required.');
    if (!app.personal.dob) errors.push('Date of Birth is required.');
    if (!app.personal.gender) errors.push('Gender is required.');
    if (!app.personal.mobile.trim()) errors.push('Student Mobile Number is required.');
    if (!app.personal.email.trim()) errors.push('Student Email Address is required.');
    if (!app.personal.fatherName.trim()) errors.push("Father's Name is required.");
    if (!app.personal.address.trim()) errors.push('Residential Address is required.');
    if (!app.personal.pinCode.trim()) errors.push('PIN Code is required.');

    // Section B validations
    if (!app.tenth.schoolName.trim()) errors.push('10th School Name is required.');
    if (!app.tenth.registerNumber.trim()) errors.push('10th Board Register Number is required.');
    if (!app.tenth.totalMarks) errors.push('10th Total Marks is required.');
    if (!app.tenth.marksheetNumber.trim()) errors.push('10th Marksheet Number is required.');

    // Section C validations
    if (!app.twelfth.schoolName.trim()) errors.push('12th School Name is required.');
    if (!app.twelfth.registerNumber.trim()) errors.push('12th Register Number is required.');
    if (!app.twelfth.mathsMarks) errors.push('12th Mathematics Marks is required.');
    if (!app.twelfth.physicsMarks) errors.push('12th Physics Marks is required.');
    if (!app.twelfth.chemistryMarks) errors.push('12th Chemistry Marks is required.');

    // Section D validations
    if (!app.certificates.aadhaarNumber.trim()) errors.push('Aadhaar Number is required.');
    if (app.specialCategory.community !== 'OC' && !app.certificates.communityCertNumber.trim()) {
      errors.push('Community Certificate Number is required for reserved category applicants.');
    }

    // Section E validations
    if (!app.preferences.firstChoice) errors.push('First Choice Department is required.');
    if (!app.preferences.secondChoice) errors.push('Second Choice Department is required.');
    if (!app.preferences.thirdChoice) errors.push('Third Choice Department is required.');

    // Prevent duplicate department selections
    if (
      app.preferences.firstChoice &&
      app.preferences.secondChoice &&
      app.preferences.firstChoice === app.preferences.secondChoice
    ) {
      errors.push('First and Second Department choices cannot be the same.');
    }
    if (
      app.preferences.secondChoice &&
      app.preferences.thirdChoice &&
      app.preferences.secondChoice === app.preferences.thirdChoice
    ) {
      errors.push('Second and Third Department choices cannot be the same.');
    }
    if (
      app.preferences.firstChoice &&
      app.preferences.thirdChoice &&
      app.preferences.firstChoice === app.preferences.thirdChoice
    ) {
      errors.push('First and Third Department choices cannot be the same.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateAllSections()) {
      onProceedToUpload(app);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSave = () => {
    onSaveDraft(app);
    saveCollegeDraft(college.code, app);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleResetForm = () => {
    clearCollegeDraft(college.code);
    const blank = createBlankApplication(college.code, college.name);
    setApp(blank);
    onSaveDraft(blank);
    setValidationErrors([]);
    setClearToast(true);
    setTimeout(() => setClearToast(false), 3000);
  };

  const handleAutoFillDemoApplication = (proceedDirectly = false) => {
    const demoApp: StudentApplication = {
      ...app,
      collegeCode: college.code,
      collegeName: college.name,
      personal: {
        fullName: 'Karthik Ramanathan',
        dob: '2007-05-14',
        calculatedAge: 18,
        gender: 'Male',
        mobile: '9840123456',
        email: 'karthik.ramanathan@example.com',
        fatherName: 'Ramanathan Krishnan',
        fatherOccupation: 'Senior Technical Architect',
        fatherMobile: '9840123450',
        motherName: 'Lakshmi Ramanathan',
        motherOccupation: 'Post Graduate Teacher',
        motherMobile: '9840123451',
        address: 'Plot No. 42, 3rd Cross Street, Gandhipuram',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        country: 'India',
        pinCode: '641012',
        nationality: 'Indian',
        religion: 'Hindu',
        communityCategory: 'BC',
      },
      tenth: {
        schoolName: 'Stanes Anglo-Indian Higher Secondary School',
        schoolAddress: 'Coimbatore, Tamil Nadu',
        board: 'Tamil Nadu State Board',
        passingYear: '2024',
        registerNumber: 'TN-SSLC-489201',
        totalMarks: 486,
        maximumMarks: 500,
        percentage: 97.2,
        marksheetNumber: 'SSLC-2024-99812',
        tcNumber: 'TC-STANES-0841',
      },
      twelfth: {
        schoolName: 'Stanes Anglo-Indian Higher Secondary School',
        schoolAddress: 'Coimbatore, Tamil Nadu',
        board: 'Tamil Nadu State Board',
        passingYear: '2026',
        isExpectedMarks: false,
        registerNumber: 'TN-HSC-789104',
        subjectGroup: 'Computer Science Mathematics',
        mathsMarks: 96,
        physicsMarks: 94,
        chemistryMarks: 92,
        optionalSubjectMarks: 98,
        expectedTotalMarks: 380,
        engineeringCutoff: 189.0, // Maths 96 + Physics 47 + Chemistry 46 = 189.00
        marksheetNumber: 'HSC-2026-44910',
        tcNumber: 'TC-STANES-1204',
      },
      certificates: {
        aadhaarNumber: '9845 2210 9812',
        communityCertNumber: 'TN-COMM-2024-99812',
        incomeCertNumber: 'TN-INC-2024-88912',
        birthCertNumber: 'TN-MC-2007-00918',
        tenthMarksheetNumber: 'SSLC-2024-99812',
        tenthTcNumber: 'TC-STANES-0841',
        twelfthMarksheetNumber: 'HSC-2026-44910',
        twelfthTcNumber: 'TC-STANES-1204',
      },
      preferences: {
        admissionType: 'Counselling',
        firstChoice: 'Computer Science and Engineering',
        secondChoice: 'Information Technology',
        thirdChoice: 'Electronics and Communication Engineering',
      },
      specialCategory: {
        community: 'BC',
        isGovtSchoolQuota: false,
        hasDisability: 'No',
      },
      documents: {},
    };

    // Attach complete set of verified sample documents matching data
    const sampleDocs = createSampleVerificationDocs(demoApp);
    demoApp.documents = sampleDocs;

    setApp(demoApp);
    saveCollegeDraft(college.code, demoApp);
    onSaveDraft(demoApp);
    setValidationErrors([]);
    setDemoToast(true);
    setTimeout(() => setDemoToast(false), 4000);

    if (proceedDirectly) {
      onProceedToUpload(demoApp);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <span>{college.name}</span>
              <span>·</span>
              <span className="font-mono">{college.code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              {t('onlineAdmissionTitle')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('academicSession')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Small Demo Button */}
            <button
              type="button"
              onClick={() => handleAutoFillDemoApplication(false)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/80 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Fill sample demo applicant data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Demo Data</span>
            </button>

            {/* Reset / Clear Form to Blank */}
            <button
              type="button"
              onClick={handleResetForm}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors shadow-sm cursor-pointer"
              title="Clear all fields to a blank form"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              <span>{t('clearForm')}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t('saveDraft')}</span>
            </button>
          </div>
        </div>

        {/* Demo Success Toast */}
        {demoToast && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t('demoFillSuccess')}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-md shrink-0">
              ✓ 9 Verification Documents Attached
            </span>
          </div>
        )}

        {/* Reset / Clear Form Success Toast */}
        {clearToast && (
          <div className="p-4 bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700/60 text-sky-900 dark:text-sky-200 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>{t('formClearedSuccess')}</span>
          </div>
        )}

        {/* Validation Errors Alert if any */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Please review and complete mandatory application fields:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-300 space-y-1">
              {validationErrors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {validationErrors.length > 5 && (
                <li>...and {validationErrors.length - 5} other fields</li>
              )}
            </ul>
          </div>
        )}

        {/* Save Draft Toast */}
        {saveToast && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Application draft saved successfully in local store!</span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl border border-slate-300/60 dark:border-slate-700">
          {[
            { id: 'A', label: t('secA') },
            { id: 'B', label: t('secB') },
            { id: 'C', label: t('secC') },
            { id: 'D', label: t('secD') },
            { id: 'E', label: t('secE') },
            { id: 'F', label: t('secF') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION A: PERSONAL INFORMATION */}
        {activeSection === 'A' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Section A: Personal Information & Family Background
              </h2>
              <p className="text-xs text-slate-500">
                Ensure details strictly match government identity records and birth certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Full Name (As per Marksheet) *
                </label>
                <input
                  type="text"
                  required
                  value={app.personal.fullName}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      personal: { ...app.personal, fullName: e.target.value },
                    })
                  }
                  placeholder="e.g. Karthik Ramanathan"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gender *
                </label>
                <select
                  value={app.personal.gender}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      personal: { ...app.personal, gender: e.target.value as any },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={app.personal.dob}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      personal: { ...app.personal, dob: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Calculated Age (Auto)
                </label>
                <div className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg text-slate-800">
                  {app.personal.calculatedAge > 0
                    ? `${app.personal.calculatedAge} Years`
                    : 'Enter DOB to calculate'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={app.personal.mobile}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      personal: { ...app.personal, mobile: e.target.value },
                    })
                  }
                  placeholder="+91 98402 11234"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={app.personal.email}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      personal: { ...app.personal, email: e.target.value },
                    })
                  }
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={app.personal.nationality}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      personal: { ...app.personal, nationality: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Religion
                </label>
                <input
                  type="text"
                  value={app.personal.religion}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      personal: { ...app.personal, religion: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Parent Details */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Parent / Guardian Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Father&apos;s Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={app.personal.fatherName}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, fatherName: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Father&apos;s Occupation
                  </label>
                  <input
                    type="text"
                    value={app.personal.fatherOccupation}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, fatherOccupation: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Father&apos;s Contact Mobile
                  </label>
                  <input
                    type="tel"
                    value={app.personal.fatherMobile}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, fatherMobile: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mother&apos;s Full Name
                  </label>
                  <input
                    type="text"
                    value={app.personal.motherName}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, motherName: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mother&apos;s Occupation
                  </label>
                  <input
                    type="text"
                    value={app.personal.motherOccupation}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, motherOccupation: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mother&apos;s Contact Mobile
                  </label>
                  <input
                    type="tel"
                    value={app.personal.motherMobile}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, motherMobile: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Permanent Residential Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Door No, Street & Locality *
                  </label>
                  <input
                    type="text"
                    required
                    value={app.personal.address}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, address: e.target.value },
                      })
                    }
                    placeholder="e.g. 42, Avinashi Road, Peelamedu"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={app.personal.district}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, district: e.target.value },
                      })
                    }
                    placeholder="Coimbatore"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Postal PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={app.personal.pinCode}
                    onChange={(e) =>
                      setApp({
                        ...app,
                        personal: { ...app.personal, pinCode: e.target.value },
                      })
                    }
                    placeholder="641004"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: TENTH STANDARD INFORMATION */}
        {activeSection === 'B' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Section B: Secondary School Leaving Certificate (10th Standard)
              </h2>
              <p className="text-xs text-slate-500">
                Data will be cross-checked against your uploaded SSLC marksheet and transfer certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  10th School Name *
                </label>
                <input
                  type="text"
                  required
                  value={app.tenth.schoolName}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, schoolName: e.target.value },
                    })
                  }
                  placeholder="e.g. Stanes Higher Secondary School"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Education Board *
                </label>
                <select
                  value={app.tenth.board}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, board: e.target.value as EducationBoard },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Tamil Nadu State Board">Tamil Nadu State Board</option>
                  <option value="CBSE">CBSE</option>
                  <option value="Other Recognized Board">Other Recognized Board</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  School Address / City
                </label>
                <input
                  type="text"
                  value={app.tenth.schoolAddress}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, schoolAddress: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Year of Passing
                </label>
                <input
                  type="text"
                  value={app.tenth.passingYear}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, passingYear: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Board Register Number *
                </label>
                <input
                  type="text"
                  required
                  value={app.tenth.registerNumber}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, registerNumber: e.target.value },
                    })
                  }
                  placeholder="e.g. TN-SSLC-489201"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total Marks Obtained *
                </label>
                <input
                  type="number"
                  required
                  value={app.tenth.totalMarks || ''}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, totalMarks: Number(e.target.value) },
                    })
                  }
                  placeholder="486"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Maximum Aggregate Marks
                </label>
                <input
                  type="number"
                  value={app.tenth.maximumMarks || 500}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, maximumMarks: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Aggregate Percentage (Auto)
                </label>
                <div className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg text-blue-800">
                  {app.tenth.percentage > 0 ? `${app.tenth.percentage}%` : '0%'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  10th Marksheet Number *
                </label>
                <input
                  type="text"
                  required
                  value={app.tenth.marksheetNumber}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, marksheetNumber: e.target.value },
                    })
                  }
                  placeholder="SSLC-2024-99812"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  10th Transfer Certificate (TC) No
                </label>
                <input
                  type="text"
                  value={app.tenth.tcNumber}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      tenth: { ...app.tenth, tcNumber: e.target.value },
                    })
                  }
                  placeholder="TC-STANES-0841"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: TWELFTH STANDARD INFORMATION & CUTOFF */}
        {activeSection === 'C' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Section C: Higher Secondary Certificate (12th HSC) & Cutoff
                </h2>
                <p className="text-xs text-slate-500">
                  Automated computation of Engineering Cutoff (Max 200) for Anna University / TNEA regulations.
                </p>
              </div>

              {/* Expected Marks Toggle */}
              <label className="inline-flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={app.twelfth.isExpectedMarks}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, isExpectedMarks: e.target.checked },
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-blue-900">
                  Awaiting Official Results (Expected Marks)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  12th School Name *
                </label>
                <input
                  type="text"
                  required
                  value={app.twelfth.schoolName}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, schoolName: e.target.value },
                    })
                  }
                  placeholder="e.g. Stanes Higher Secondary School"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Group *
                </label>
                <select
                  value={app.twelfth.subjectGroup}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, subjectGroup: e.target.value as SubjectGroup },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Computer Science Mathematics">Computer Science Mathematics</option>
                  <option value="Biology Mathematics">Biology Mathematics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  12th Register Number *
                </label>
                <input
                  type="text"
                  required
                  value={app.twelfth.registerNumber}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, registerNumber: e.target.value },
                    })
                  }
                  placeholder="TN-HSC-789104"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mathematics Marks (Out of 100) *
                </label>
                <input
                  type="number"
                  required
                  max={100}
                  min={0}
                  value={app.twelfth.mathsMarks || ''}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, mathsMarks: Number(e.target.value) },
                    })
                  }
                  placeholder="98"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Physics Marks (Out of 100) *
                </label>
                <input
                  type="number"
                  required
                  max={100}
                  min={0}
                  value={app.twelfth.physicsMarks || ''}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, physicsMarks: Number(e.target.value) },
                    })
                  }
                  placeholder="96"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chemistry Marks (Out of 100) *
                </label>
                <input
                  type="number"
                  required
                  max={100}
                  min={0}
                  value={app.twelfth.chemistryMarks || ''}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, chemistryMarks: Number(e.target.value) },
                    })
                  }
                  placeholder="94"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {app.twelfth.subjectGroup === 'Computer Science Mathematics'
                    ? 'Computer Science Marks (Out of 100)'
                    : 'Biology Marks (Out of 100)'}
                </label>
                <input
                  type="number"
                  max={100}
                  min={0}
                  value={app.twelfth.optionalSubjectMarks || ''}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, optionalSubjectMarks: Number(e.target.value) },
                    })
                  }
                  placeholder="99"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Automatic Engineering Cutoff Display */}
              <div className="p-4 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-xl text-white sm:col-span-2 flex items-center justify-between shadow-md">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-sky-200">
                    Calculated Engineering Cutoff
                  </span>
                  <p className="text-xs text-sky-100">
                    Maths (100) + Physics/2 (50) + Chemistry/2 (50)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                    {app.twelfth.engineeringCutoff.toFixed(2)}
                  </span>
                  <span className="text-xs font-medium text-sky-200 block">/ 200.00</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  12th Marksheet Number (If Issued)
                </label>
                <input
                  type="text"
                  value={app.twelfth.marksheetNumber || ''}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, marksheetNumber: e.target.value },
                    })
                  }
                  placeholder="HSC-2026-11029"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  12th Transfer Certificate (TC) Number
                </label>
                <input
                  type="text"
                  value={app.twelfth.tcNumber || ''}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      twelfth: { ...app.twelfth, tcNumber: e.target.value },
                    })
                  }
                  placeholder="TC-STANES-1104"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION D: CERTIFICATE DETAILS */}
        {activeSection === 'D' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Section D: Certificate Identifier Numbers
              </h2>
              <p className="text-xs text-slate-500">
                Sensitive identifiers are encrypted and protected in accordance with UIDAI and Digital Personal Data Protection standards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Aadhaar Number (12 Digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={app.certificates.aadhaarNumber}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      certificates: {
                        ...app.certificates,
                        aadhaarNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="9845 2210 9812"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Encrypted & masked automatically in all audit views.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Community Certificate Number
                </label>
                <input
                  type="text"
                  value={app.certificates.communityCertNumber}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      certificates: {
                        ...app.certificates,
                        communityCertNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="TN-COMM-2024-00192"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Income Certificate Number
                </label>
                <input
                  type="text"
                  value={app.certificates.incomeCertNumber}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      certificates: {
                        ...app.certificates,
                        incomeCertNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="TN-INC-2024-88912"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Birth Certificate Number
                </label>
                <input
                  type="text"
                  value={app.certificates.birthCertNumber}
                  onChange={(e) =>
                    setApp({
                      ...app,
                      certificates: {
                        ...app.certificates,
                        birthCertNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="BC-CBE-2008-4109"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  10th Marksheet Serial Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={app.tenth.marksheetNumber || 'Syncs from Section B'}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  10th TC Serial Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={app.tenth.tcNumber || 'Syncs from Section B'}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION E: ADMISSION PREFERENCES */}
        {activeSection === 'E' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Section E: Admission Stream & Department Preferences
              </h2>
              <p className="text-xs text-slate-500">
                Choose three distinct engineering departments. Duplicate department choices are automatically prevented.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Admission Type / Quota *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'Counselling',
                      title: 'Single-Window Government Counselling',
                      desc: 'Allocated through TNEA rank list with subsidized statutory fee framework.',
                    },
                    {
                      id: 'Management',
                      title: 'Institutional Management Quota',
                      desc: 'Direct merit-cum-preference scrutiny through institutional admission committee.',
                    },
                  ].map((type) => (
                    <label
                      key={type.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        app.preferences.admissionType === type.id
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-600/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="admissionType"
                        value={type.id}
                        checked={app.preferences.admissionType === type.id}
                        onChange={() => {
                          const isMgmt = type.id === 'Management';
                          setApp({
                            ...app,
                            preferences: {
                              ...app.preferences,
                              admissionType: type.id as AdmissionType,
                            },
                            // When Management Quota is chosen, state government scholarships and 7.5% quota do not apply
                            specialCategory: {
                              ...app.specialCategory,
                              isGovtSchoolQuota: isMgmt ? false : app.specialCategory.isGovtSchoolQuota,
                            },
                          });
                        }}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{type.title}</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {type.desc}
                        </p>
                        {type.id === 'Management' && (
                          <span className="inline-block mt-2 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                            State Govt Scholarships & 7.5% Quota not applicable
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Three Department Choices */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Select 3 Department Choices (Ranked by Preference)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* First Choice */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                      1st Choice (Primary) *
                    </span>
                    <select
                      value={app.preferences.firstChoice}
                      onChange={(e) =>
                        setApp({
                          ...app,
                          preferences: { ...app.preferences, firstChoice: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS_LIST.map((dept) => (
                        <option
                          key={dept}
                          value={dept}
                          disabled={
                            dept === app.preferences.secondChoice ||
                            dept === app.preferences.thirdChoice
                          }
                        >
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Second Choice */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      2nd Choice *
                    </span>
                    <select
                      value={app.preferences.secondChoice}
                      onChange={(e) =>
                        setApp({
                          ...app,
                          preferences: { ...app.preferences, secondChoice: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS_LIST.map((dept) => (
                        <option
                          key={dept}
                          value={dept}
                          disabled={
                            dept === app.preferences.firstChoice ||
                            dept === app.preferences.thirdChoice
                          }
                        >
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Third Choice */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      3rd Choice *
                    </span>
                    <select
                      value={app.preferences.thirdChoice}
                      onChange={(e) =>
                        setApp({
                          ...app,
                          preferences: { ...app.preferences, thirdChoice: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS_LIST.map((dept) => (
                        <option
                          key={dept}
                          value={dept}
                          disabled={
                            dept === app.preferences.firstChoice ||
                            dept === app.preferences.secondChoice
                          }
                        >
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION F: COMMUNITY AND SPECIAL CATEGORY */}
        {activeSection === 'F' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Section F: Community Classification & Special Reservation Quotas
              </h2>
              <p className="text-xs text-slate-500">
                Community selection determines reservation seat matrix verification and AICTE minimum percentage thresholds.
              </p>
            </div>

            <div className="space-y-6">
              {/* Community Radios */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Community Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['OC', 'BC', 'BCM', 'MBC / DNC', 'SC', 'SCA', 'ST'] as CommunityCategory[]).map(
                    (cat) => (
                      <label
                        key={cat}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          app.specialCategory.community === cat
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-600/20'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="communityCat"
                          value={cat}
                          checked={app.specialCategory.community === cat}
                          onChange={() =>
                            setApp({
                              ...app,
                              specialCategory: { ...app.specialCategory, community: cat },
                              personal: { ...app.personal, communityCategory: cat },
                            })
                          }
                          className="sr-only"
                        />
                        <span className="text-xs">{cat}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Government Scholarships & Preferential Quota: Shown ONLY for Single-Window Counselling */}
              {app.preferences.admissionType !== 'Management' ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                      Government Scholarships & Preferential Quota
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                      Counselling Quota Only
                    </span>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={app.specialCategory.isGovtSchoolQuota}
                      onChange={(e) =>
                        setApp({
                          ...app,
                          specialCategory: {
                            ...app.specialCategory,
                            isGovtSchoolQuota: e.target.checked,
                          },
                        })
                      }
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Tamil Nadu 7.5% Government School Preferential Reservation & Fee Waiver Scholarship
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Check this box if you studied continuously from Grade 6 to Grade 12 in Tamil Nadu Government Schools (entitles eligible candidates to 100% government tuition & hostel scholarship upon Headmaster & CEO bonafide verification).
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Institutional Management Quota Active
                    </h4>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                      State Government Scholarships, statutory tuition fee waivers, and the 7.5% Tamil Nadu Government School reservation are not applicable for Institutional Management Quota admissions under state regulatory directives.
                    </p>
                  </div>
                </div>
              )}

              {/* Disability Special Category */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Are you applying under a disability-related special category?
                  </label>
                  <div className="flex gap-4 mt-2">
                    {(['No', 'Yes', 'Prefer not to disclose'] as const).map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="disabilityOpt"
                          value={opt}
                          checked={app.specialCategory.hasDisability === opt}
                          onChange={() =>
                            setApp({
                              ...app,
                              specialCategory: {
                                ...app.specialCategory,
                                hasDisability: opt,
                              },
                            })
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dynamic fields if Yes */}
                {app.specialCategory.hasDisability === 'Yes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Disability Category
                      </label>
                      <input
                        type="text"
                        value={app.specialCategory.disabilityCategory || ''}
                        onChange={(e) =>
                          setApp({
                            ...app,
                            specialCategory: {
                              ...app.specialCategory,
                              disabilityCategory: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. Locomotor Disability"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Disability Percentage (%)
                      </label>
                      <input
                        type="number"
                        min={40}
                        max={100}
                        value={app.specialCategory.disabilityPercentage || ''}
                        onChange={(e) =>
                          setApp({
                            ...app,
                            specialCategory: {
                              ...app.specialCategory,
                              disabilityPercentage: Number(e.target.value),
                            },
                          })
                        }
                        placeholder="40"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Bottom Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToCollegeProfile')}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              {t('saveDraft')}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 text-xs font-extrabold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-700/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>{t('nextDocumentUpload')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
