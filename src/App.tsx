/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CollegeSelector } from './components/CollegeSelector';
import { CollegeProfile } from './components/CollegeProfile';
import { ApplicationForm } from './components/ApplicationForm';
import { DocumentUpload } from './components/DocumentUpload';
import { VerificationLiveModal } from './components/VerificationLiveModal';
import { VerificationReportView } from './components/VerificationReportView';
import { ApplicationReview } from './components/ApplicationReview';
import { SubmissionSuccess } from './components/SubmissionSuccess';
import { ApplicationTracking } from './components/ApplicationTracking';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';

import { StudentApplication, CollegeInfo, UploadedDocItem } from './types/admissions';
import { DEMO_COLLEGES } from './data/colleges';
import {
  getStoredApplications,
  saveNewApplication,
  recordCollegeVisit,
  getVisitedColleges,
  saveCollegeDraft,
  getCollegeDraft,
  getLastVisitedCollegeCode,
  createBlankApplication,
} from './services/storage';
import { runDocumentVerificationPipeline } from './services/verificationEngine';

// Map browser URL paths directly to application views for clean refresh support
const pathToView = (pathname: string): string => {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (clean === 'admin' || clean === 'dashboard' || clean === 'admin-dashboard') return 'admin-dashboard';
  if (clean === 'tracking' || clean === 'track') return 'tracking';
  if (clean === 'apply' || clean === 'application' || clean === 'form') return 'application-form';
  if (clean === 'upload' || clean === 'documents' || clean === 'document-upload') return 'document-upload';
  if (clean === 'report' || clean === 'verification' || clean === 'verification-report') return 'verification-report';
  if (clean === 'review' || clean === 'application-review') return 'application-review';
  if (clean === 'success' || clean === 'submission-success') return 'submission-success';
  if (clean === 'college-profile' || clean === 'profile') return 'college-profile';
  return 'college-selection';
};

const viewToPath = (viewName: string): string => {
  switch (viewName) {
    case 'admin-dashboard':
      return '/admin';
    case 'tracking':
      return '/tracking';
    case 'application-form':
      return '/apply';
    case 'document-upload':
      return '/upload';
    case 'verification-report':
      return '/report';
    case 'application-review':
      return '/review';
    case 'submission-success':
      return '/success';
    case 'college-profile':
      return '/college-profile';
    case 'college-selection':
    default:
      return '/';
  }
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Synchronize view state from current browser path (handles /admin, /dashboard, etc. on refresh)
  const view = pathToView(location.pathname);

  const handleNavigate = (targetView: string) => {
    const targetPath = viewToPath(targetView);
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Initialize visited colleges from storage
  const [visitedColleges, setVisitedColleges] = useState<CollegeInfo[]>(() => {
    const visitedCodes = getVisitedColleges();
    if (visitedCodes.length > 0) {
      return visitedCodes
        .map((code) => DEMO_COLLEGES.find((c) => c.code === code))
        .filter((c): c is CollegeInfo => !!c);
    }
    return [];
  });

  // Selected college: null by default so no college is displayed until user chooses one
  const [selectedCollege, setSelectedCollege] = useState<CollegeInfo | null>(null);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isVerificationLiveRunning, setIsVerificationLiveRunning] = useState(false);
  const [trackingSearchId, setTrackingSearchId] = useState<string>('');

  // Current active draft application - starts completely blank by default
  const [currentApplication, setCurrentApplication] = useState<StudentApplication>(() => {
    return createBlankApplication(DEMO_COLLEGES[0].code, DEMO_COLLEGES[0].name);
  });

  // Update visited history list helper
  const updateVisitedList = (college: CollegeInfo) => {
    recordCollegeVisit(college.code);
    setVisitedColleges((prev) => {
      const filtered = prev.filter((c) => c.code !== college.code);
      return [college, ...filtered];
    });
  };

  // When college selection changes, update application college details & record history
  const handleSelectCollege = (college: CollegeInfo, directToApplication = false) => {
    setSelectedCollege(college);
    updateVisitedList(college);

    // Fresh blank application for selected college
    setCurrentApplication(createBlankApplication(college.code, college.name));

    if (directToApplication) {
      handleNavigate('application-form');
    } else {
      handleNavigate('college-profile');
    }
  };

  // Resume application action triggered from navbar next to Authentix logo
  const handleResumeApplication = (college: CollegeInfo) => {
    setSelectedCollege(college);
    updateVisitedList(college);

    const draft = getCollegeDraft(college.code);
    if (draft) {
      setCurrentApplication(draft);
    } else {
      setCurrentApplication(createBlankApplication(college.code, college.name));
    }

    // Directly open the application form so the user can continue giving details
    handleNavigate('application-form');
  };

  const handleStartApplication = () => {
    const targetCollege = selectedCollege || DEMO_COLLEGES[0];
    updateVisitedList(targetCollege);
    setCurrentApplication(createBlankApplication(targetCollege.code, targetCollege.name));
    handleNavigate('application-form');
  };

  const handleSaveDraft = (app: StudentApplication) => {
    setCurrentApplication(app);
    if (app.collegeCode) {
      saveCollegeDraft(app.collegeCode, app);
    }
  };

  const handleProceedToUpload = (app: StudentApplication) => {
    setCurrentApplication(app);
    if (app.collegeCode) {
      saveCollegeDraft(app.collegeCode, app);
    }
    handleNavigate('document-upload');
  };

  const handleUpdateDocs = (docs: Record<string, UploadedDocItem | null>) => {
    setCurrentApplication((prev) => {
      const updated = {
        ...prev,
        documents: docs,
      };
      if (updated.collegeCode) {
        saveCollegeDraft(updated.collegeCode, updated);
      }
      return updated;
    });
  };

  const handleTriggerVerification = () => {
    setIsVerificationLiveRunning(true);
  };

  const handleVerificationAnimationComplete = () => {
    setIsVerificationLiveRunning(false);
    const existing = getStoredApplications();
    const summary = runDocumentVerificationPipeline(currentApplication, existing);
    setCurrentApplication((prev) => ({
      ...prev,
      verificationSummary: summary,
    }));
    handleNavigate('verification-report');
  };

  const handleProceedToReview = () => {
    handleNavigate('application-review');
  };

  const handleFinalSubmit = () => {
    const finalApp: StudentApplication = {
      ...currentApplication,
      status:
        currentApplication.verificationSummary?.overallStatus === 'PASSED'
          ? 'PRELIMINARY_VERIFIED'
          : 'MANUAL_REVIEW',
      submissionDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Student Portal',
          action: 'Formal Application Submission',
          details: 'Application submitted after document OCR and regulatory rules verification.',
          newStatus: 'PRELIMINARY_VERIFIED',
        },
      ],
    };

    saveNewApplication(finalApp);
    setCurrentApplication(finalApp);
    handleNavigate('submission-success');
  };

  const activeCollege = selectedCollege || DEMO_COLLEGES[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        activeView={view}
        onNavigate={handleNavigate}
        selectedCollege={selectedCollege}
        visitedColleges={visitedColleges}
        onResumeApplication={handleResumeApplication}
        onOpenAdminLogin={() => setIsAdminModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-grow">
        {view === 'college-selection' && (
          <CollegeSelector
            onSelectCollege={handleSelectCollege}
            onNavigate={handleNavigate}
          />
        )}

        {view === 'college-profile' && (
          <CollegeProfile
            college={activeCollege}
            onStartApplication={handleStartApplication}
            onNavigate={handleNavigate}
          />
        )}

        {view === 'application-form' && (
          <ApplicationForm
            college={activeCollege}
            initialApplication={currentApplication}
            onSaveDraft={handleSaveDraft}
            onProceedToUpload={handleProceedToUpload}
            onBack={() => handleNavigate('college-selection')}
          />
        )}

        {view === 'document-upload' && (
          <DocumentUpload
            application={currentApplication}
            onUpdateDocs={handleUpdateDocs}
            onUpdateApplication={(app) => {
              setCurrentApplication(app);
              if (app.collegeCode) {
                saveCollegeDraft(app.collegeCode, app);
              }
            }}
            onStartVerification={handleTriggerVerification}
            onBack={() => handleNavigate('application-form')}
          />
        )}

        {view === 'verification-report' && currentApplication.verificationSummary && (
          <VerificationReportView
            application={currentApplication}
            verificationSummary={currentApplication.verificationSummary}
            onProceedToReview={handleProceedToReview}
            onBackToUpload={() => handleNavigate('document-upload')}
          />
        )}

        {view === 'application-review' && (
          <ApplicationReview
            application={currentApplication}
            college={activeCollege}
            onSubmit={handleFinalSubmit}
            onBackToVerification={() => handleNavigate('verification-report')}
          />
        )}

        {view === 'submission-success' && (
          <SubmissionSuccess
            application={currentApplication}
            onTrackApplication={() => {
              setTrackingSearchId(currentApplication.id);
              handleNavigate('tracking');
            }}
            onReturnToCollege={() => handleNavigate('college-selection')}
          />
        )}

        {view === 'tracking' && (
          <ApplicationTracking
            initialSearchId={trackingSearchId}
            onNavigateToForm={(app) => {
              setCurrentApplication(app);
              handleNavigate('application-form');
            }}
          />
        )}

        {view === 'admin-dashboard' && (
          <AdminDashboard
            currentCollegeCode={activeCollege.code}
            onLogout={() => handleNavigate('college-selection')}
          />
        )}
      </main>

      {/* Live Verification Progression Modal */}
      <VerificationLiveModal
        isOpen={isVerificationLiveRunning}
        onComplete={handleVerificationAnimationComplete}
      />

      {/* Global / Contextual Admin Sign-In Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        collegeContext={selectedCollege}
        onLoginSuccess={(collegeCode) => {
          const match = DEMO_COLLEGES.find((c) => c.code === collegeCode);
          if (match) setSelectedCollege(match);
          handleNavigate('admin-dashboard');
        }}
      />
    </div>
  );
}
