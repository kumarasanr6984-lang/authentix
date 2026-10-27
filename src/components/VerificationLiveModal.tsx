/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ScanText,
  GitCompare,
  FileCheck2,
  ShieldAlert,
  Scale,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface VerificationLiveModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface VerificationStage {
  id: number;
  label: string;
  subtext: string;
  icon: any;
}

export const VerificationLiveModal: React.FC<VerificationLiveModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  const stages: VerificationStage[] = [
    {
      id: 1,
      label: 'Reading Documents',
      subtext: 'Rasterizing uploaded PDF and image matrices for OCR processing...',
      icon: FileText,
    },
    {
      id: 2,
      label: 'Extracting Information',
      subtext: 'Executing layout analysis and token bounding-box text extraction...',
      icon: ScanText,
    },
    {
      id: 3,
      label: 'Matching Application Details',
      subtext: 'Running normalized Levenshtein fuzzy similarity across candidate credentials...',
      icon: GitCompare,
    },
    {
      id: 4,
      label: 'Checking Certificate Numbers',
      subtext: 'Validating e-District registry serials and board marksheet identifiers...',
      icon: FileCheck2,
    },
    {
      id: 5,
      label: 'Analyzing Document Integrity',
      subtext: 'Inspecting institutional stamps, security borders, and font baseline continuity...',
      icon: ShieldAlert,
    },
    {
      id: 6,
      label: 'Checking Eligibility & Regulatory Norms',
      subtext: 'Evaluating AICTE PCM aggregate (>=45%/40%) and Anna University cutoff formulas...',
      icon: Scale,
    },
    {
      id: 7,
      label: 'Generating Verification Report',
      subtext: 'Synthesizing explainable confidence metrics and preparing preliminary verdict...',
      icon: Sparkles,
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIdx(0);
      return;
    }

    const timer = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 600);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(timer);
  }, [isOpen, onComplete, stages.length]);

  if (!isOpen) return null;

  const currentStage = stages[currentStageIdx];
  const progressPercent = Math.round(((currentStageIdx + 1) / stages.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/60 border border-blue-400/30 text-xs font-semibold text-sky-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300" />
            <span>AI Verification Pipeline Active</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Authentix Scrutiny Engine
          </h2>
          <p className="text-xs text-sky-100/80 max-w-md mx-auto">
            Processing candidate submissions through multi-modal OCR, cross-document verification, and regulatory compliance algorithms.
          </p>
        </div>

        {/* Content & Progress */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Active Stage Spotlight */}
          <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shrink-0">
              {React.createElement(currentStage.icon, { className: 'w-6 h-6 animate-pulse' })}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Stage {currentStage.id} of {stages.length}
                </span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{progressPercent}%</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{currentStage.label}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{currentStage.subtext}</p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stages List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {stages.map((stg, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              return (
                <div
                  key={stg.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors ${
                    isCurrent
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : isPast
                      ? 'text-slate-700 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{stg.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {isPast ? 'Cleared' : isCurrent ? 'Processing...' : 'Queued'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
