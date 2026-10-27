/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MapPin,
  Lock,
  ArrowRight,
  Monitor,
  Cpu,
  BookOpen,
  Home,
  Bus,
  Trophy,
  Wifi,
  Briefcase,
  Lightbulb,
  Coffee,
  CheckCircle2,
  FileText,
  Building,
  GraduationCap,
  Shield,
  Layers,
} from 'lucide-react';
import { CollegeInfo } from '../types/admissions';
import { AdminLoginModal } from './AdminLoginModal';
import { getCollegeDepartments } from '../services/storage';
import { useThemeLanguage } from '../context/ThemeLanguageContext.tsx';

interface CollegeProfileProps {
  college: CollegeInfo;
  onStartApplication: () => void;
  onNavigate: (view: string) => void;
}

export const CollegeProfile: React.FC<CollegeProfileProps> = ({
  college,
  onStartApplication,
  onNavigate,
}) => {
  const { t } = useThemeLanguage();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const departments = getCollegeDepartments(college.code);

  const getFacilityIcon = (iconName: string) => {
    switch (iconName) {
      case 'Monitor':
        return <Monitor className="w-5 h-5 text-blue-600" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-blue-600" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'Home':
        return <Home className="w-5 h-5 text-blue-600" />;
      case 'Bus':
        return <Bus className="w-5 h-5 text-blue-600" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-blue-600" />;
      case 'Wifi':
        return <Wifi className="w-5 h-5 text-blue-600" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'Lightbulb':
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-blue-600" />;
      default:
        return <Building className="w-5 h-5 text-blue-600" />;
    }
  };

  const isAsteria = college.code === '2026';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      {/* Top Scoped Bar on College Profile with Admin Sign-In */}
      <section className="bg-slate-900 text-white border-b border-slate-800 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
              {t('code')}: {college.code}
            </span>
            <span className="font-medium text-slate-300 hidden sm:inline">
              Official Admission Verification Portal · {college.name}
            </span>
          </div>

          {/* Admin Sign-In Button on Top of College Profile */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-sky-200" />
            <span>{t('adminSignIn')} ({isAsteria ? 'Albert' : 'Sathya'})</span>
          </button>
        </div>
      </section>

      {/* Hero Campus Banner Section */}
      <section className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Institution Header Details */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-md shrink-0">
                {college.logoText}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {college.name}
                  </h1>
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded">
                    {t('code')}: {college.code}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{college.location}</span>
                  <span>·</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{college.accreditation}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-1">{college.tagline}</p>
              </div>
            </div>

            {/* Prominent Royal Blue Application Form CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={onStartApplication}
                className="flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-extrabold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-700/25 active:scale-[0.99] transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{t('applicationForm').toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Campus Visual Card */}
          <div className="mt-8 relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 h-72 sm:h-96 bg-slate-900">
            <img
              src={college.bannerImage}
              alt={`${college.name} Campus`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div className="max-w-2xl space-y-2">
                <span className="text-[11px] font-mono tracking-widest uppercase text-sky-300">
                  Campus Overview & Infrastructure
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed drop-shadow">
                  {college.description}
                </p>
              </div>
              <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-center">
                <span className="text-xs text-slate-300 block">Seat Matrix Intake</span>
                <span className="text-xl font-bold font-mono text-white">
                  {departments.reduce((sum, d) => sum + d.approvedIntake, 0)} Seats
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Facilities, Departments, & Admission Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* Campus Facilities (10 specific visual cards) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                World-Class Infrastructure
              </h2>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{t('campusFacilities')}</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">10 Comprehensive Amenities</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {college.facilities.map((fac, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                  {getFacilityIcon(fac.icon)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{fac.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {fac.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Available Departments & Seat Distribution */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Academic Programs
              </h2>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {t('academicPrograms')} ({departments.length})
              </h3>
            </div>
            <button
              onClick={onStartApplication}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>{t('applyForBatch')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Dept Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4 text-right">Approved Intake</th>
                  <th className="py-3 px-4 text-right">Allocated</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4 text-right">Estimated Cutoff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {departments.map((dept) => {
                  const available = dept.approvedIntake - dept.allocatedSeats;
                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{dept.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{dept.name}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{dept.approvedIntake}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {dept.allocatedSeats}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        {available} seats
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-800 dark:text-blue-300">
                        {dept.cutoffEstimate.toFixed(1)} / 200
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Admission Information & Regulatory Guidelines */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
              <GraduationCap className="w-4 h-4" />
              <span>{t('admissionPathways')}</span>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">1. Single Window Counselling (TNEA):</strong> 65% of approved intake seats are filled via Tamil Nadu Engineering Admissions merit counseling based strictly on higher secondary normalized cutoff marks.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">2. Institutional Management Quota:</strong> 35% of sanctioned seats are processed under merit-cum-preference management allocation through Authentix automated verification.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>{t('statutoryCompliance')}</span>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">Community Quota Norms:</strong> Tamil Nadu statutory reservation ratios (OC: 31%, BC: 26.5%, BCM: 3.5%, MBC/DNC: 20%, SC: 15%, SCA: 3%, ST: 1%) are strictly audited by our verification engine.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Government School 7.5% Quota:</strong> Eligible candidates who studied 6th through 12th standard in Tamil Nadu Government Schools receive preferential allocation without tuition fees.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Application Prompt */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold">Ready to apply to {college.name}?</h3>
            <p className="text-xs text-sky-100">
              Submit your academic details and upload certificates for instant AI preliminary validation.
            </p>
          </div>
          <button
            onClick={onStartApplication}
            className="px-8 py-3 text-sm font-extrabold text-blue-900 bg-white hover:bg-sky-50 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
          >
            {t('applicationForm').toUpperCase()}
          </button>
        </div>
      </div>

      {/* Admin Login Modal specifically scoped to this college */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        collegeContext={college}
        onLoginSuccess={() => {
          onNavigate('admin-dashboard');
        }}
      />
    </div>
  );
};
