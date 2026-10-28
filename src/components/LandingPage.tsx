/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldCheck,
  FileCheck2,
  ScanText,
  Scale,
  Users,
  ArrowRight,
  School,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DEMO_COLLEGES } from '../data/colleges';
import { CollegeInfo } from '../types/admissions';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onSelectCollege: (college: CollegeInfo) => void;
  onOpenAdminLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectCollege,
  onOpenAdminLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner Tagline */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-2 px-4 text-center text-xs font-medium tracking-wide">
        <span className="opacity-80">Smart India Hackathon 2026</span>
        <span className="mx-2 opacity-50">·</span>
        <span className="font-semibold text-sky-200">Problem Statement ID: SIH26261</span>
        <span className="mx-2 opacity-50">·</span>
        <span>AI-Powered Application Validation, Document Authentication & Regulatory Compliance</span>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Next-Generation Admission Scrutiny</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Smarter Admissions. <br />
                <span className="text-blue-600">Trusted Verification.</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                An intelligent admission platform that validates applications, verifies documents, and simplifies regulatory compliance. Automating preliminary scrutiny for high-volume engineering college admissions while keeping administrators in full authoritative control.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('college-selection')}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 active:scale-[0.99]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#how-it-works"
                  className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  How It Works
                </a>

                <button
                  onClick={() => onNavigate('tracking')}
                  className="px-5 py-3 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Student Portal
                </button>

                <button
                  onClick={onOpenAdminLogin}
                  className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin Login</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>TNEA & AICTE Rules Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>UIDAI Aadhaar Masking Protocol</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero Irreversible AI Decisions</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 group">
                <img
                  src="/assets/images/hero_authentix_admissions_1792929580725.jpg"
                  alt="Authentix Engineering Admissions Campus"
                  className="w-full h-80 lg:h-96 object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2">
                  <div className="flex items-center justify-between text-xs text-sky-200">
                    <span className="font-semibold tracking-wider uppercase">Authentix Live Engine</span>
                    <span className="font-mono tabular-nums">1,500 Applications Screened</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Autonomous Multi-Document Cross-Referencing
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Instantly extracts marks, school registers, and community certificates, flagging subtle discrepancies before manual review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Institutions Quick Access */}
      <section className="py-12 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Featured Demo Institutions</h2>
              <p className="text-xs text-slate-500">Explore participating technical institutes and launch applications</p>
            </div>
            <button
              onClick={() => onNavigate('college-selection')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Search by College Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEMO_COLLEGES.map((college) => (
              <div
                key={college.code}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row"
              >
                <div className="sm:w-48 h-40 sm:h-auto relative overflow-hidden bg-slate-900 shrink-0">
                  <img
                    src={college.bannerImage}
                    alt={college.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-blue-700 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    {college.code}
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-between flex-grow">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{college.name}</h3>
                    <p className="text-xs text-slate-500 mb-2">{college.location}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {college.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                      11 Engineering Programs
                    </span>
                    <button
                      onClick={() => onSelectCollege(college)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Profile & Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
              System Architecture
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900">
              End-to-End Automated Admission Scrutiny
            </h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Designed specifically for engineering colleges receiving 1,000–1,500 applications per cycle, replacing error-prone manual spreadsheets with automated, explainable verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">01. Application Intake</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured multi-section form capturing candidate bio-data, 10th and 12th STEM marks, cutoff computation, and 3 department preferences with duplicate prevention.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <ScanText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">02. Document OCR & Fuzzy Match</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts names, dates of birth, registration numbers, and aggregate scores. Performs normalized Levenshtein similarity to reconcile abbreviation and initial variances.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">03. Integrity & QR Audits</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Examines certificate seals, digital 2D barcodes, and font baseline anomalies to detect suspicious modifications, routing unverified items to human manual review.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">04. Regulatory Compliance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated validation against AICTE aggregate thresholds, TNEA cutoff formulas, 7.5% government school preferential quota, and department intake limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-extrabold text-blue-400 font-mono tabular-nums">1,500+</p>
              <p className="text-xs text-slate-400 mt-1">Applications Handled Per Cycle</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-400 font-mono tabular-nums">98.4%</p>
              <p className="text-xs text-slate-400 mt-1">OCR Precision Rate</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-400 font-mono tabular-nums">&lt; 3.2s</p>
              <p className="text-xs text-slate-400 mt-1">Preliminary Verification Speed</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-400 font-mono tabular-nums">100%</p>
              <p className="text-xs text-slate-400 mt-1">Explainable Audit Trail</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">Authentix AI</span>
            <span>·</span>
            <span>Smart India Hackathon 2026</span>
            <span>·</span>
            <span>SIH26261 Educational Prototype</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('college-selection')} className="hover:text-blue-700">
              Colleges
            </button>
            <button onClick={() => onNavigate('tracking')} className="hover:text-blue-700">
              Application Status
            </button>
            <button onClick={onOpenAdminLogin} className="hover:text-blue-700">
              Admin Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
