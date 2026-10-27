/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, X, Shield, ArrowRight } from 'lucide-react';
import { CollegeInfo } from '../types/admissions';
import { DEMO_COLLEGES } from '../data/colleges';
import { setAdminSession } from '../services/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  collegeContext: CollegeInfo | null;
  onLoginSuccess: (collegeCode: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  collegeContext,
  onLoginSuccess,
}) => {
  const [selectedCollegeCode, setSelectedCollegeCode] = useState<string>(
    collegeContext?.code || DEMO_COLLEGES[0].code
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (collegeContext) {
      setSelectedCollegeCode(collegeContext.code);
    }
  }, [collegeContext]);

  if (!isOpen) return null;

  const currentCollege =
    DEMO_COLLEGES.find((c) => c.code === selectedCollegeCode) || DEMO_COLLEGES[0];

  const isAsteria = currentCollege.code === '2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const u = username.trim().toLowerCase();
    const p = password.trim();

    // Check username flexibility for Asteria (Code 2026)
    const isValidAsteriaUser =
      isAsteria &&
      (u === 'albert@asteria' ||
        u === 'albert@collegename' ||
        u === 'albert@asteria.ac.in' ||
        u === 'albert@asteria.edu' ||
        u === 'albert@2026' ||
        u === 'albert');

    // Check username flexibility for Bluecrest (Code 2025)
    const isValidBluecrestUser =
      !isAsteria &&
      (u === 'sathya@bluecrest' ||
        u === 'sathya@collegename' ||
        u === 'sathya@bluecrest.edu.in' ||
        u === 'sathya@bluecrest.edu' ||
        u === 'sathya@2025' ||
        u === 'sathya');

    // Password check
    const isValidAsteriaPass =
      isAsteria &&
      (p === 'asteria@2026' || p === 'collegename@2026' || p === 'asteria');

    const isValidBluecrestPass =
      !isAsteria &&
      (p === 'bluecrest@2026' || p === 'collegename@2026' || p === 'bluecrest');

    const isAuthorized =
      (isAsteria && isValidAsteriaUser && isValidAsteriaPass) ||
      (!isAsteria && isValidBluecrestUser && isValidBluecrestPass);

    if (isAuthorized) {
      setIsSuccess(true);
      setAdminSession({
        collegeCode: currentCollege.code,
        adminUsername: isAsteria ? 'albert@asteria' : 'sathya@bluecrest',
        adminDisplay: isAsteria ? 'Albert (Dean of Admissions)' : 'Sathya (Registrar & Scrutiny Chief)',
        loginTime: new Date().toISOString(),
      });

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        onLoginSuccess(currentCollege.code);
      }, 600);
    } else {
      setErrorMsg(
        `Invalid administrative credentials for ${currentCollege.name}. Please enter your authorized officer username and password.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-sky-200 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-sky-300" />
            <span>Administrative Scrutiny Console</span>
          </div>
          <h2 className="text-xl font-bold text-white">Institutional Officer Sign-In</h2>
          <p className="text-xs text-sky-100/80 mt-1">
            Sign in to inspect admissions for {currentCollege.name} ({currentCollege.code})
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Institution Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Technical Institution
            </label>
            <select
              value={selectedCollegeCode}
              onChange={(e) => {
                setSelectedCollegeCode(e.target.value);
                setErrorMsg('');
                setUsername('');
                setPassword('');
              }}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {DEMO_COLLEGES.map((c) => (
                <option key={c.code} value={c.code} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {c.name} (Code: {c.code})
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Officer Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isAsteria ? 'albert@asteria' : 'sathya@bluecrest'}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {isSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Authentication verified. Loading administrative dashboard...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Authenticate & Enter Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
