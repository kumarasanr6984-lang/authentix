/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { School, UserCheck, Lock, ChevronDown, Sun, Moon, Globe } from 'lucide-react';
import { CollegeInfo } from '../types/admissions';
import { getCurrentAdminSession } from '../services/storage';
import { useThemeLanguage, Language } from '../context/ThemeLanguageContext.tsx';

interface NavbarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  selectedCollege: CollegeInfo | null;
  visitedColleges: CollegeInfo[];
  onResumeApplication: (college: CollegeInfo) => void;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  selectedCollege,
  visitedColleges,
  onResumeApplication,
  onOpenAdminLogin,
}) => {
  const { theme, toggleTheme, language, setLanguage, t } = useThemeLanguage();
  const adminSession = getCurrentAdminSession();
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Only display an institution in navbar if the user has explicitly selected one
  const displayedCollege = selectedCollege;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Static Brand Lockup + Visited College Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Authentix logo is non-clickable: does NOT navigate or open college selection */}
            <div className="flex items-center gap-2.5 text-left select-none">
              <img
                src="/assets/authentix_logo.svg"
                alt="Authentix"
                className="w-9 h-9 rounded-xl object-contain shadow-sm"
              />
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Authentix
                </span>
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 tracking-tight -mt-0.5">
                  {t('tagline')}
                </span>
              </div>
            </div>


            {/* Nearer to Authentix logo: Visited College Name (No Continue Details button) */}
            {displayedCollege && (
              <div className="relative ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-700 flex items-center">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onResumeApplication(displayedCollege)}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 dark:bg-slate-800/80 hover:bg-blue-100/90 dark:hover:bg-slate-750 border border-blue-200 dark:border-slate-700 transition-all text-left cursor-pointer"
                    title={`Selected institution: ${displayedCollege.name}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors truncate max-w-[150px] sm:max-w-[220px]">
                          {displayedCollege.name}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 -mt-0.5">
                          {t('code')}: {displayedCollege.code}
                        </span>
                      </div>
                    </div>
                  </button>
                  {/* If more than 1 college visited, show history switcher */}
                  {visitedColleges.length > 1 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Switch between visited institutions"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {showHistoryDropdown && (
                        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in">
                          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Visited Institutions
                          </div>
                          {visitedColleges.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setShowHistoryDropdown(false);
                                onResumeApplication(c);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-xs flex items-center justify-between group cursor-pointer"
                            >
                              <div className="truncate">
                                <span className="font-bold text-slate-900 dark:text-white block truncate">
                                  {c.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {t('code')}: {c.code}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => onNavigate('college-selection')}
              className={`hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'college-selection' || activeView === 'college-profile'
                  ? 'text-blue-700 dark:text-blue-400 font-bold'
                  : ''
              }`}
            >
              {t('selectCollege')}
            </button>
            <button
              onClick={() => onNavigate('tracking')}
              className={`hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'tracking' ? 'text-blue-700 dark:text-blue-400 font-bold' : ''
              }`}
            >
              {t('trackApplication')}
            </button>
          </nav>

          {/* Zone 3: Primary Actions + Language Dropdown + Dark/Light Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                title="Change Language"
                aria-label="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'English' : language === 'ta' ? 'தமிழ்' : 'हिन्दी'}
                </span>
                <span className="sm:hidden font-mono uppercase">
                  {language}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in">
                  {[
                    { code: 'en' as Language, label: 'English', sub: 'Default' },
                    { code: 'ta' as Language, label: 'தமிழ்', sub: 'Tamil' },
                    { code: 'hi' as Language, label: 'हिन्दी', sub: 'Hindi' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        language === l.code
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{l.label}</span>
                      <span className="text-[10px] text-slate-400">{l.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
              aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-200" />
              )}
            </button>

            {/* Admin Console Button */}
            {adminSession ? (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('adminConsole')} ({adminSession.adminDisplay.split(' ')[0]})</span>
                <span className="sm:hidden">{t('adminConsole')}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{t('adminSignIn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
