/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentApplication, CollegeDepartment, AuditLogEntry, ApplicationStatus } from '../types/admissions';
import { INITIAL_SEEDED_APPLICATIONS } from '../data/sampleApplications';
import { DEMO_COLLEGES } from '../data/colleges';

const STORAGE_KEYS = {
  APPLICATIONS: 'authentix_applications_v1',
  SEATS: 'authentix_college_seats_v1',
  AUTH: 'authentix_admin_auth_v1',
};

// Initialize applications
export function getStoredApplications(): StudentApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored applications:', err);
  }

  // Seed default applications
  saveStoredApplications(INITIAL_SEEDED_APPLICATIONS);
  return INITIAL_SEEDED_APPLICATIONS;
}

export function saveStoredApplications(apps: StudentApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  } catch (err) {
    console.error('Error saving applications to storage:', err);
  }
}

export function getApplicationById(id: string): StudentApplication | undefined {
  const apps = getStoredApplications();
  return apps.find((a) => a.id.trim().toUpperCase() === id.trim().toUpperCase());
}

export function findApplicationsByQuery(query: string): StudentApplication[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];
  const apps = getStoredApplications();
  return apps.filter(
    (a) =>
      a.id.toLowerCase().includes(clean) ||
      a.personal.fullName.toLowerCase().includes(clean) ||
      a.personal.mobile.replace(/\D/g, '').includes(clean.replace(/\D/g, '')) ||
      a.personal.dob === clean
  );
}

export function isDemoFormApplication(app: StudentApplication): boolean {
  if (app.isDemo || app.isDemoApplication) return true;
  // Heuristic matching demo applicant details (preserving pre-seeded sample records like EVA-2026-0001)
  if (
    app.id !== 'EVA-2026-0001' &&
    app.personal &&
    app.personal.fullName === 'Karthik Ramanathan' &&
    (app.personal.email === 'karthik.ramanathan@example.com' ||
      app.certificates?.aadhaarNumber?.replace(/\D/g, '') === '984522109812' ||
      app.tenth?.registerNumber === 'TN-SSLC-489201')
  ) {
    return true;
  }
  return false;
}

export function deleteApplication(id: string): boolean {
  try {
    const apps = getStoredApplications();
    const cleanId = id.trim().toUpperCase();
    const filtered = apps.filter((a) => a.id.trim().toUpperCase() !== cleanId);
    if (filtered.length !== apps.length) {
      saveStoredApplications(filtered);
      return true;
    }
  } catch (err) {
    console.error('Error deleting application:', err);
  }
  return false;
}

export function saveNewApplication(app: StudentApplication): void {
  let apps = getStoredApplications();

  // If the demo form is applied, check if the demo form was already applied previously.
  // If applied a second (or subsequent) time, delete the application(s) applied the first time.
  if (isDemoFormApplication(app)) {
    const previousDemoApps = apps.filter(
      (existing) => isDemoFormApplication(existing) && existing.id !== app.id
    );

    if (previousDemoApps.length > 0) {
      const prevIds = previousDemoApps.map((a) => a.id);
      apps = apps.filter((existing) => !prevIds.includes(existing.id));
      console.log(
        `[Authentix Storage] Demo form applied second time: Deleted application(s) first time applied (${prevIds.join(', ')}).`
      );

      if (app.auditTrail) {
        app.auditTrail.unshift({
          id: `aud-${Date.now()}-demo-cleanup`,
          timestamp: new Date().toISOString(),
          actor: 'Authentix Lifecycle Engine',
          action: 'Previous Demo Application Deleted',
          details: `Demo form applied second time. Deleted application applied the first time: ${prevIds.join(', ')}.`,
        });
      }
    }
  }

  const existingIdx = apps.findIndex((a) => a.id === app.id);
  if (existingIdx >= 0) {
    apps[existingIdx] = app;
  } else {
    apps.unshift(app);
  }
  saveStoredApplications(apps);
}

export function updateApplicationStatus(
  appId: string,
  newStatus: ApplicationStatus,
  actor: string,
  actionText: string,
  notes?: string,
  rejectionReason?: string
): StudentApplication | null {
  const apps = getStoredApplications();
  const target = apps.find((a) => a.id === appId);
  if (!target) return null;

  const previousStatus = target.status;
  target.status = newStatus;
  target.lastUpdatedDate = new Date().toISOString();
  if (notes) target.reviewNotes = notes;
  if (rejectionReason) target.rejectionReason = rejectionReason;

  const log: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    action: actionText,
    details: notes || `Application transitioned from ${previousStatus} to ${newStatus}.`,
    previousStatus,
    newStatus,
  };

  target.auditTrail.unshift(log);

  // If approved, dynamically increment allocated seats for firstChoice department in that college
  if (newStatus === 'APPROVED' && previousStatus !== 'APPROVED') {
    allocateSeat(target.collegeCode, target.preferences.firstChoice);
  }

  saveStoredApplications(apps);
  return target;
}

export function requestApplicationCorrection(
  appId: string,
  actor: string,
  instructions: string,
  fieldsToFix: string[]
): StudentApplication | null {
  const apps = getStoredApplications();
  const target = apps.find((a) => a.id === appId);
  if (!target) return null;

  target.status = 'CORRECTION_REQUESTED';
  target.lastUpdatedDate = new Date().toISOString();
  target.correctionRequest = {
    id: `corr-${Date.now()}`,
    requestedAt: new Date().toISOString(),
    requestedBy: actor,
    instructions,
    fieldsToFix,
    resolved: false,
  };

  const log: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor,
    action: 'Correction Requested by Administrator',
    details: `Correction required on: ${fieldsToFix.join(', ')}. Instructions: ${instructions}`,
    previousStatus: target.status,
    newStatus: 'CORRECTION_REQUESTED',
  };

  target.auditTrail.unshift(log);
  saveStoredApplications(apps);
  return target;
}

// Seat management per college
export function getCollegeDepartments(collegeCode: string): CollegeDepartment[] {
  const college = DEMO_COLLEGES.find((c) => c.code === collegeCode);
  if (!college) return [];

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SEATS}_${collegeCode}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading college departments:', err);
  }

  return college.departments;
}

export function saveCollegeDepartments(collegeCode: string, depts: CollegeDepartment[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEYS.SEATS}_${collegeCode}`, JSON.stringify(depts));
  } catch (err) {
    console.error('Error saving college departments:', err);
  }
}

export function allocateSeat(collegeCode: string, deptName: string): void {
  const depts = getCollegeDepartments(collegeCode);
  const target = depts.find((d) => d.name === deptName);
  if (target && target.allocatedSeats < target.approvedIntake) {
    target.allocatedSeats += 1;
    saveCollegeDepartments(collegeCode, depts);
  }
}

// Admin session persistence
export interface AdminSession {
  collegeCode: string;
  adminUsername: string;
  adminDisplay: string;
  loginTime: string;
}

export function getCurrentAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading admin session:', err);
  }
  return null;
}

export function setAdminSession(session: AdminSession | null): void {
  try {
    if (session) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  } catch (err) {
    console.error('Error saving admin session:', err);
  }
}

// Reset data to defaults
export function resetPlatformToDefaults(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
    DEMO_COLLEGES.forEach((c) => {
      localStorage.removeItem(`${STORAGE_KEYS.SEATS}_${c.code}`);
    });
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem('authentix_visited_history_v1');
    localStorage.removeItem('authentix_college_drafts_v1');
    saveStoredApplications(INITIAL_SEEDED_APPLICATIONS);
  } catch (err) {
    console.error('Error resetting store:', err);
  }
}

// College visit history and application draft persistence
const HISTORY_KEY = 'authentix_visited_history_v1';
const DRAFTS_KEY = 'authentix_college_drafts_v1';

export function recordCollegeVisit(collegeCode: string): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    let list: string[] = raw ? JSON.parse(raw) : [];
    list = [collegeCode, ...list.filter((c) => c !== collegeCode)];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error recording college visit:', e);
  }
}

export function getVisitedColleges(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLastVisitedCollegeCode(): string | null {
  const list = getVisitedColleges();
  return list.length > 0 ? list[0] : null;
}

export function saveCollegeDraft(collegeCode: string, app: StudentApplication): void {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    const drafts: Record<string, StudentApplication> = raw ? JSON.parse(raw) : {};
    drafts[collegeCode] = app;
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    recordCollegeVisit(collegeCode);
  } catch (e) {
    console.warn('Error saving college draft:', e);
  }
}

export function getCollegeDraft(collegeCode: string): StudentApplication | null {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return null;
    const drafts = JSON.parse(raw);
    return drafts[collegeCode] || null;
  } catch {
    return null;
  }
}

export function clearCollegeDraft(collegeCode: string): void {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return;
    const drafts = JSON.parse(raw);
    delete drafts[collegeCode];
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.warn('Error clearing college draft:', e);
  }
}

export function clearAllCollegeDrafts(): void {
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch (e) {
    console.warn('Error clearing all drafts:', e);
  }
}

export function createBlankApplication(
  collegeCode = '2026',
  collegeName = 'Asteria Institute of Technology'
): StudentApplication {
  return {
    id: `EVA-${collegeCode}-0${Math.floor(100 + Math.random() * 900)}`,
    collegeCode,
    collegeName,
    personal: {
      fullName: '',
      dob: '',
      calculatedAge: 0,
      gender: '',
      mobile: '',
      email: '',
      fatherName: '',
      fatherOccupation: '',
      fatherMobile: '',
      motherName: '',
      motherOccupation: '',
      motherMobile: '',
      address: '',
      district: '',
      state: 'Tamil Nadu',
      country: 'India',
      pinCode: '',
      nationality: 'Indian',
      religion: '',
      communityCategory: 'OC',
    },
    tenth: {
      schoolName: '',
      schoolAddress: '',
      board: 'Tamil Nadu State Board',
      passingYear: '2024',
      registerNumber: '',
      totalMarks: 0,
      maximumMarks: 500,
      percentage: 0,
      marksheetNumber: '',
      tcNumber: '',
    },
    twelfth: {
      schoolName: '',
      schoolAddress: '',
      board: 'Tamil Nadu State Board',
      passingYear: '2026',
      isExpectedMarks: false,
      registerNumber: '',
      subjectGroup: 'Computer Science Mathematics',
      mathsMarks: 0,
      physicsMarks: 0,
      chemistryMarks: 0,
      optionalSubjectMarks: 0,
      expectedTotalMarks: 0,
      engineeringCutoff: 0,
      marksheetNumber: '',
      tcNumber: '',
    },
    certificates: {
      aadhaarNumber: '',
      communityCertNumber: '',
      incomeCertNumber: '',
      birthCertNumber: '',
      tenthMarksheetNumber: '',
      tenthTcNumber: '',
      twelfthMarksheetNumber: '',
      twelfthTcNumber: '',
    },
    preferences: {
      admissionType: 'Counselling',
      firstChoice: '',
      secondChoice: '',
      thirdChoice: '',
    },
    specialCategory: {
      community: 'OC',
      isGovtSchoolQuota: false,
      hasDisability: 'No',
    },
    documents: {},
    status: 'SUBMITTED',
    submissionDate: new Date().toISOString(),
    lastUpdatedDate: new Date().toISOString(),
    auditTrail: [],
  };
}

// Clean up any stale demo drafts that might have pre-filled user form automatically
try {
  const rawDrafts = localStorage.getItem(DRAFTS_KEY);
  if (rawDrafts && rawDrafts.includes('Karthik Ramanathan')) {
    localStorage.removeItem(DRAFTS_KEY);
  }
} catch {
  // Ignore in SSR/restricted environments
}

