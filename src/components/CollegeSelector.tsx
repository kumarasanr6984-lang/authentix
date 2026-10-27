import React, { useState } from 'react';
import { Search, MapPin, AlertCircle, ArrowRight, Building2, School } from 'lucide-react';
import { DEMO_COLLEGES } from '../data/colleges';
import { CollegeInfo } from '../types/admissions';
import { useThemeLanguage } from '../context/ThemeLanguageContext.tsx';

interface CollegeSelectorProps {
  onSelectCollege: (college: CollegeInfo, directToApplication?: boolean) => void;
  onNavigate: (view: string) => void;
  promptNotice?: string;
}

export const CollegeSelector: React.FC<CollegeSelectorProps> = ({
  onSelectCollege,
  promptNotice,
}) => {
  const { t } = useThemeLanguage();
  const [searchInput, setSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const cleanQuery = searchInput.trim().toUpperCase();

  // Find matching college by numerical code (2026 or 2025) or institution name
  const matchedColleges = cleanQuery
    ? DEMO_COLLEGES.filter(
        (c) =>
          c.code === cleanQuery ||
          c.code.includes(cleanQuery) ||
          c.name.toUpperCase().includes(cleanQuery) ||
          c.location.toUpperCase().includes(cleanQuery)
      )
    : [];

  const isInvalidCode =
    hasSearched &&
    cleanQuery.length >= 3 &&
    matchedColleges.length === 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (matchedColleges.length === 1) {
      onSelectCollege(matchedColleges[0], false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Breadcrumbs / Intro */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-md border border-blue-100 dark:border-blue-900">
            <School className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Participating Technical Institutions</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('collegeSelectionHeading')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {t('collegeSelectionSub')}
          </p>
        </div>

        {promptNotice && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center gap-3 shadow-sm">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">{promptNotice}</p>
          </div>
        )}

        {/* Manual 4-Digit Code Entry Search Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t('enterInstitutionCode')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setHasSearched(true);
                }}
                placeholder={t('enterCodePlaceholder')}
                className="w-full pl-11 pr-28 py-3.5 text-sm sm:text-base font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                autoFocus
              />
              {cleanQuery && (
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('verifyCode')}</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
              <span>Enter 4-digit code (e.g. 2026 or 2025)</span>
              <span>Protected admissions portal</span>
            </div>
          </form>

          {/* Dynamic Institution Result displayed only after entering valid code */}
          {matchedColleges.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('recognizedInstitution')} ({matchedColleges.length})
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
                {matchedColleges.map((college) => (
                  <div
                    key={college.code}
                    className="w-full p-4.5 hover:bg-white dark:hover:bg-slate-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        {college.logoText}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                            {college.name}
                          </h3>
                          <span className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded">
                            {t('code')}: {college.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{college.location}</span>
                          <span>·</span>
                          <span>{college.accreditation.split('|')[0].trim()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectCollege(college, false)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <span>{t('institutionalProfile')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invalid Code Error Alert */}
          {isInvalidCode && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Unrecognized Institution Code: &ldquo;{cleanQuery}&rdquo;</p>
                <p className="text-amber-800 dark:text-amber-300">
                  Please verify the official 4-digit code assigned by the Higher Education Board (e.g. <strong>2026</strong> for Asteria Institute of Technology or <strong>2025</strong> for Bluecrest College of Engineering).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
