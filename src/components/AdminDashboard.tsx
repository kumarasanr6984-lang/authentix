/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  Building2,
  GraduationCap,
  LogOut,
  Layers,
  History,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  StudentApplication,
  CollegeInfo,
  ApplicationStatus,
  CollegeDepartment,
} from '../types/admissions';
import { DEMO_COLLEGES } from '../data/colleges';
import { COMMAND_CENTER_STATS } from '../data/sampleApplications';
import {
  getStoredApplications,
  getCollegeDepartments,
  updateApplicationStatus,
  requestApplicationCorrection,
  getCurrentAdminSession,
  setAdminSession,
} from '../services/storage';
import { maskAadhaar } from '../services/verificationEngine';
import { useThemeLanguage } from '../context/ThemeLanguageContext.tsx';
import { NameVerificationModal } from './NameVerificationModal';

interface AdminDashboardProps {
  currentCollegeCode: string;
  onLogout: () => void;
  onSelectApplicationForReview?: (app: StudentApplication) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentCollegeCode,
  onLogout,
}) => {
  const { t } = useThemeLanguage();
  const adminSession = getCurrentAdminSession();
  const college =
    DEMO_COLLEGES.find((c) => c.code === currentCollegeCode) || DEMO_COLLEGES[0];

  const [applications, setApplications] = useState<StudentApplication[]>(() =>
    getStoredApplications()
  );
  const [departments, setDepartments] = useState<CollegeDepartment[]>(() =>
    getCollegeDepartments(college.code)
  );

  // Command Center active filter
  const [activeStatFilter, setActiveStatFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Inspection Drawer
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);

  // Action Dialog states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionInstructions, setCorrectionInstructions] = useState('');
  const [correctionFields, setCorrectionFields] = useState<string[]>([
    'Tenth Transfer Certificate',
  ]);
  const [actionNotes, setActionNotes] = useState('');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [modalFormName, setModalFormName] = useState('R. Kumar');
  const [modalDocName, setModalDocName] = useState('Kumar R');

  // Filter applications strictly belonging to this college
  const collegeApps = useMemo(() => {
    return applications.filter((a) => a.collegeCode === college.code);
  }, [applications, college.code]);

  // Filtered List
  const filteredApps = useMemo(() => {
    return collegeApps.filter((a) => {
      // Command Center Card Quick Filters
      if (activeStatFilter === 'PASSED' && a.status !== 'APPROVED' && a.status !== 'PRELIMINARY_VERIFIED') {
        return false;
      }
      if (activeStatFilter === 'MANUAL_REVIEW' && a.status !== 'MANUAL_REVIEW') {
        return false;
      }
      if (activeStatFilter === 'INCOMPLETE' && a.status !== 'CORRECTION_REQUESTED' && a.status !== 'SUBMITTED') {
        return false;
      }
      if (
        activeStatFilter === 'ELIGIBILITY_ISSUES' &&
        a.verificationSummary?.complianceRules.every((r) => r.passed)
      ) {
        return false;
      }

      // Dropdown Status Filter
      if (statusFilter !== 'ALL' && a.status !== statusFilter) {
        return false;
      }

      // Department Filter
      if (deptFilter !== 'ALL' && a.preferences.firstChoice !== deptFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.personal.fullName.toLowerCase().includes(q);
        const matchId = a.id.toLowerCase().includes(q);
        const matchReg = a.tenth.registerNumber.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchReg) return false;
      }

      return true;
    });
  }, [collegeApps, activeStatFilter, statusFilter, deptFilter, searchQuery]);

  // Refresh data
  const refreshAppData = () => {
    setApplications(getStoredApplications());
    setDepartments(getCollegeDepartments(college.code));
  };

  // Administrative Actions
  const handleApprove = (app: StudentApplication) => {
    const actor = adminSession?.adminDisplay || 'Admissions Administrator';
    const notes = actionNotes.trim() || 'Approved after certificate scrutiny & cutoff eligibility audit.';
    const updated = updateApplicationStatus(
      app.id,
      'APPROVED',
      actor,
      'Application Approved by Officer',
      notes
    );
    if (updated) {
      refreshAppData();
      setSelectedApp(updated);
      setActionNotes('');
    }
  };

  const handleOpenReject = (app: StudentApplication) => {
    setSelectedApp(app);
    setRejectionReasonInput('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedApp || !rejectionReasonInput.trim()) {
      alert('A valid institutional rejection reason is mandatory.');
      return;
    }
    const actor = adminSession?.adminDisplay || 'Admissions Administrator';
    const updated = updateApplicationStatus(
      selectedApp.id,
      'REJECTED',
      actor,
      'Application Rejected by Officer',
      actionNotes,
      rejectionReasonInput
    );
    if (updated) {
      refreshAppData();
      setSelectedApp(updated);
      setIsRejectModalOpen(false);
      setRejectionReasonInput('');
    }
  };

  const handleOpenCorrection = (app: StudentApplication) => {
    setSelectedApp(app);
    setCorrectionInstructions('');
    setIsCorrectionModalOpen(true);
  };

  const handleConfirmCorrection = () => {
    if (!selectedApp || !correctionInstructions.trim()) {
      alert('Please provide instructions for the candidate.');
      return;
    }
    const actor = adminSession?.adminDisplay || 'Admissions Administrator';
    const updated = requestApplicationCorrection(
      selectedApp.id,
      actor,
      correctionInstructions,
      correctionFields
    );
    if (updated) {
      refreshAppData();
      setSelectedApp(updated);
      setIsCorrectionModalOpen(false);
      setCorrectionInstructions('');
    }
  };

  const handleMarkManualReview = (app: StudentApplication) => {
    const actor = adminSession?.adminDisplay || 'Admissions Administrator';
    const notes = actionNotes.trim() || 'Flagged for senior dean manual verification.';
    const updated = updateApplicationStatus(
      app.id,
      'MANUAL_REVIEW',
      actor,
      'Marked for Human Manual Review',
      notes
    );
    if (updated) {
      refreshAppData();
      setSelectedApp(updated);
      setActionNotes('');
    }
  };

  const handleExportCsv = () => {
    const rows = [
      [
        'Application ID',
        'Student Name',
        'College Code',
        'Admission Type',
        'First Choice Department',
        'Cutoff Marks',
        'Community Category',
        'Verification Status',
        'Submission Timestamp',
        'Review Remarks',
      ],
      ...collegeApps.map((a) => [
        a.id,
        `"${a.personal.fullName}"`,
        a.collegeCode,
        a.preferences.admissionType,
        `"${a.preferences.firstChoice}"`,
        a.twelfth.engineeringCutoff.toFixed(2),
        a.specialCategory.community,
        a.status,
        a.submissionDate,
        `"${a.reviewNotes || a.rejectionReason || 'None'}"`,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Authentix_Audit_Report_${college.code}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdfReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`AUTHENTIX INSTITUTIONAL SCRUTINY AUDIT`, 14, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official College: ${college.name} (Code: ${college.code}) · https://authentix-edu.in`, 14, 23);
      doc.text(
        `Generated By: ${adminSession?.adminDisplay || 'Admissions Dean'} · ${new Date().toLocaleString()}`,
        14,
        29
      );

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Command Center Scrutiny Metrics', 14, 46);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sanctioned Institution Intake: ${departments.reduce((s, d) => s + d.approvedIntake, 0)} Seats`, 14, 53);
      doc.text(`Applications Received: ${collegeApps.length}`, 14, 59);
      doc.text(`Approved Confirmations: ${collegeApps.filter((a) => a.status === 'APPROVED').length}`, 14, 65);
      doc.text(`Under Manual Review: ${collegeApps.filter((a) => a.status === 'MANUAL_REVIEW').length}`, 14, 71);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Scrutinized Candidate Applications Ledger', 14, 85);

      let yPos = 94;
      doc.setFontSize(8);
      collegeApps.forEach((a, i) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. [${a.id}] ${a.personal.fullName}`, 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Dept: ${a.preferences.firstChoice} | Cutoff: ${a.twelfth.engineeringCutoff.toFixed(2)} | Status: ${a.status}`,
          14,
          yPos + 5
        );
        doc.text(
          `Notes: ${a.reviewNotes || a.rejectionReason || 'Cleared without reservations.'}`,
          14,
          yPos + 9
        );
        yPos += 16;
      });

      doc.save(`Authentix_Institutional_Audit_${college.code}.pdf`);
    } catch (e) {
      console.error('Error generating PDF audit report:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      {/* Top Scoped Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {college.logoText}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white">{college.name}</h1>
                <span className="font-mono text-[10px] bg-slate-800 text-sky-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {t('code')}: {college.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Logged in as:{' '}
                <strong className="text-slate-200">
                  {adminSession?.adminDisplay || college.adminDisplay}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('exportCsv')}</span>
            </button>

            <button
              onClick={handleExportPdfReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('auditPdf')}</span>
            </button>

            <button
              onClick={() => {
                setAdminSession(null);
                onLogout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-900/60 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('signOut')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* COMMAND CENTER METRICS */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-100 dark:border-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Executive Command Center</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {t('adminDashboardTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time high-throughput scrutiny dashboard. Click any category tile to filter records.
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={() => setActiveStatFilter('ALL')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeStatFilter === 'ALL'
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/60 ring-2 ring-blue-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('totalApps')}
              </span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {COMMAND_CENTER_STATS.total}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                Institutional Cycle
              </span>
            </button>

            <button
              onClick={() => setActiveStatFilter('PASSED')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeStatFilter === 'PASSED'
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/60 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                {t('preliminaryPassed')}
              </span>
              <span className="text-2xl font-extrabold font-mono text-emerald-800 dark:text-emerald-300 tabular-nums">
                {COMMAND_CENTER_STATS.passed}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block mt-1">
                OCR & Rules Cleared
              </span>
            </button>

            <button
              onClick={() => setActiveStatFilter('MANUAL_REVIEW')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeStatFilter === 'MANUAL_REVIEW'
                  ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/60 ring-2 ring-amber-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                {t('manualReviewReq')}
              </span>
              <span className="text-2xl font-extrabold font-mono text-amber-800 dark:text-amber-300 tabular-nums">
                {COMMAND_CENTER_STATS.manualReview}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 block mt-1">
                Fuzzy variances flagged
              </span>
            </button>

            <button
              onClick={() => setActiveStatFilter('INCOMPLETE')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeStatFilter === 'INCOMPLETE'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                {t('incompleteApps')}
              </span>
              <span className="text-2xl font-extrabold font-mono text-indigo-800 dark:text-indigo-300 tabular-nums">
                {COMMAND_CENTER_STATS.incomplete}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-500 block mt-1">
                Clarification requested
              </span>
            </button>

            <button
              onClick={() => setActiveStatFilter('ELIGIBILITY_ISSUES')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeStatFilter === 'ELIGIBILITY_ISSUES'
                  ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/60 ring-2 ring-rose-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                {t('eligibilityIssues')}
              </span>
              <span className="text-2xl font-extrabold font-mono text-rose-800 dark:text-rose-300 tabular-nums">
                {COMMAND_CENTER_STATS.eligibilityIssues}
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-500 block mt-1">
                AICTE / Age Non-compliant
              </span>
            </button>
          </div>
        </section>

        {/* LIVE SEAT AVAILABILITY MATRIX */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-100 dark:border-blue-900">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Sanctioned Capacity</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {t('liveSeatsMatrix')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seats update dynamically upon officer approval actions.
              </p>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Total Approved Intake:{' '}
              <strong className="font-mono text-slate-900 dark:text-white">
                {departments.reduce((s, d) => s + d.approvedIntake, 0)} Seats
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Dept</th>
                  <th className="py-2.5 px-3">Approved Intake</th>
                  <th className="py-2.5 px-3">Allocated Seats</th>
                  <th className="py-2.5 px-3">Available Seats</th>
                  <th className="py-2.5 px-3">Counselling Quota</th>
                  <th className="py-2.5 px-3">Management Quota</th>
                  <th className="py-2.5 px-3">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {departments.map((d) => {
                  const avail = d.approvedIntake - d.allocatedSeats;
                  const util = Math.round((d.allocatedSeats / d.approvedIntake) * 100);

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{d.name}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">{d.approvedIntake}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-blue-700">
                        {d.allocatedSeats}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-emerald-700">
                        {avail}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                        {d.counsellingQuota}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                        {d.managementQuota}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${util}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{util}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* APPLICATION MANAGEMENT TABLE */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Application Scrutiny Ledger ({filteredApps.length})
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative review workspace for {college.name}
              </p>
            </div>

            {/* Table Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate name, ID..."
                  className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 w-44 sm:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PRELIMINARY_VERIFIED">Preliminary Verified</option>
                <option value="MANUAL_REVIEW">Manual Review</option>
                <option value="CORRECTION_REQUESTED">Correction Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {(activeStatFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveStatFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-2 text-xs text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Applications Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Application ID</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Department Preference</th>
                  <th className="py-3 px-3">Cutoff</th>
                  <th className="py-3 px-3">Stream</th>
                  <th className="py-3 px-3">Verification Verdict</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredApps.map((a) => (
                  <tr key={a.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{a.id}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{a.personal.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Reg: {a.tenth.registerNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-semibold truncate max-w-[180px]">
                      {a.preferences.firstChoice}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums font-bold text-blue-900">
                      {a.twelfth.engineeringCutoff.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {a.preferences.admissionType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                          a.verificationSummary?.overallStatus === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : a.verificationSummary?.overallStatus === 'MANUAL_REVIEW_REQUIRED'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {a.verificationSummary?.overallStatus.replace(/_/g, ' ') || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded font-mono ${
                          a.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'CORRECTION_REQUESTED'
                            ? 'bg-amber-100 text-amber-800'
                            : a.status === 'MANUAL_REVIEW'
                            ? 'bg-amber-50 text-amber-800'
                            : a.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedApp(a)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* INSPECTION MODAL / DRAWER */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  {selectedApp.id}
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedApp.personal.fullName}
                </h3>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300">
                  Cutoff: {selectedApp.twelfth.engineeringCutoff.toFixed(2)} / 200
                </span>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Top Banner Status */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Current Application Status
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-extrabold font-mono text-slate-900">
                      {selectedApp.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-600">
                      Submitted: {new Date(selectedApp.submissionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {selectedApp.rejectionReason && (
                  <div className="text-xs text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 max-w-sm">
                    <strong>Rejection Reason:</strong> {selectedApp.rejectionReason}
                  </div>
                )}
                {selectedApp.reviewNotes && (
                  <div className="text-xs text-slate-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 max-w-sm">
                    <strong>Review Remarks:</strong> {selectedApp.reviewNotes}
                  </div>
                )}
              </div>

              {/* Explainable Verification Match Ledger */}
              {selectedApp.verificationSummary && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Explainable Verification Match Ledger
                    </h4>
                    <span className="text-xs font-mono text-blue-700 font-bold">
                      Confidence: {selectedApp.verificationSummary.overallScorePercent}%
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Field</th>
                          <th className="py-2.5 px-3">Submitted</th>
                          <th className="py-2.5 px-3">Extracted OCR</th>
                          <th className="py-2.5 px-3">Verdict</th>
                          <th className="py-2.5 px-3">Reliability</th>
                          <th className="py-2.5 px-3">Reason / Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {selectedApp.verificationSummary.documentsReport
                          .flatMap((d) => d.fields)
                          .map((fld, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {fld.fieldName}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-800">
                                {fld.submittedValue}
                              </td>
                              <td className="py-2 px-3 font-mono text-blue-900">
                                {fld.extractedValue}
                              </td>
                              <td className="py-2 px-3">
                                {fld.nameVerdict === 'VERIFIED' ? (
                                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Verified</span>
                                  </span>
                                ) : fld.nameVerdict === 'POSSIBLE_MATCH_MANUAL_REVIEW' ? (
                                  <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Possible Match</span>
                                  </span>
                                ) : fld.nameVerdict === 'NAME_MISMATCH' ? (
                                  <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Name Mismatch</span>
                                  </span>
                                ) : fld.nameVerdict === 'UNABLE_TO_VERIFY' ? (
                                  <span className="text-slate-600 font-bold inline-flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Unable to Verify</span>
                                  </span>
                                ) : fld.matchResult === 'MATCH' ? (
                                  <span className="text-emerald-700 font-bold">MATCH</span>
                                ) : fld.matchResult === 'PARTIAL' ? (
                                  <span className="text-amber-700 font-bold">PARTIAL</span>
                                ) : (
                                  <span className="text-rose-700 font-bold">MISMATCH</span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums">
                                {fld.confidence !== null ? `${fld.confidence}%` : '—'}
                              </td>
                              <td className="py-2 px-3 text-[11px] max-w-xs">
                                {(fld.nameVerdict ? fld.nameVerdict === 'VERIFIED' : fld.matchResult === 'MATCH') ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-1.5 text-rose-700 font-semibold">
                                    <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 stroke-[3]" />
                                    <span>{fld.reason}</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Uploaded Certificates & Proofs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.entries(selectedApp.documents)
                    .filter(([_, d]) => d !== null)
                    .map(([k, d]) => (
                      <div
                        key={k}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{d?.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {d?.fileSize}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Reviewer Note Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Administrative Review Remarks
                </label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter decision rationale or instructions for candidate..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Audit Trail */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Action Audit Trail ({selectedApp.auditTrail.length})
                </span>
                <div className="divide-y divide-slate-100 text-xs text-slate-600">
                  {selectedApp.auditTrail.map((log) => (
                    <div key={log.id} className="py-2 flex justify-between gap-2">
                      <div>
                        <strong className="text-slate-900">{log.action}</strong> ({log.actor}):{' '}
                        <span>{log.details}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Admin Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleApprove(selectedApp)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Application</span>
                </button>

                <button
                  onClick={() => handleOpenCorrection(selectedApp)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Request Correction</span>
                </button>

                <button
                  onClick={() => handleMarkManualReview(selectedApp)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Mark Manual Review</span>
                </button>

                <button
                  onClick={() => handleOpenReject(selectedApp)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {isRejectModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3 text-rose-900">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold">Mandatory Rejection Rationale</h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  Educational regulations require an explainable reason when rejecting an admission dossier.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Specific Grounds for Rejection *
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. PCM aggregate is below the AICTE prescribed minimum threshold (45%), or fraudulent marksheet submitted."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION REQUEST MODAL */}
      {isCorrectionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3 text-amber-900">
              <RotateCcw className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold">Request Candidate Correction</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  The candidate will be notified via their tracking portal to correct specific fields or re-upload certificates.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Instructions for Candidate *
              </label>
              <textarea
                required
                rows={3}
                value={correctionInstructions}
                onChange={(e) => setCorrectionInstructions(e.target.value)}
                placeholder="e.g. Please re-upload a clear copy of your 10th Standard Transfer Certificate; the serial number is blurred."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCorrectionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCorrection}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors cursor-pointer"
              >
                Send Correction Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intelligent Name Verification & OCR Inspector Modal */}
      <NameVerificationModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        initialFormName={selectedApp?.personal.fullName || modalFormName}
        initialDocName={
          selectedApp?.verificationSummary?.documentsReport
            .flatMap((d) => d.fields)
            .find((f) => f.nameVerdict)?.extractedValue || modalDocName
        }
      />
    </div>
  );
};
