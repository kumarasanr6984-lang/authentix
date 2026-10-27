/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EducationBoard = 'Tamil Nadu State Board' | 'CBSE' | 'Other Recognized Board';

export type SubjectGroup = 'Computer Science Mathematics' | 'Biology Mathematics';

export type AdmissionType = 'Counselling' | 'Management';

export type CommunityCategory = 'OC' | 'BC' | 'BCM' | 'MBC / DNC' | 'SC' | 'SCA' | 'ST';

export type VerificationStatusColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'PRELIMINARY_VERIFIED'
  | 'MANUAL_REVIEW'
  | 'CORRECTION_REQUESTED'
  | 'ADMINISTRATIVE_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface PersonalInfo {
  fullName: string;
  dob: string;
  calculatedAge: number;
  gender: 'Male' | 'Female' | 'Other' | '';
  mobile: string;
  email: string;
  fatherName: string;
  fatherOccupation: string;
  fatherMobile: string;
  motherName: string;
  motherOccupation: string;
  motherMobile: string;
  address: string;
  district: string;
  state: string;
  country: string;
  pinCode: string;
  nationality: string;
  religion: string;
  communityCategory: CommunityCategory;
}

export interface TenthInfo {
  schoolName: string;
  schoolAddress: string;
  board: EducationBoard;
  passingYear: string;
  registerNumber: string;
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  marksheetNumber: string;
  tcNumber: string;
}

export interface TwelfthInfo {
  schoolName: string;
  schoolAddress: string;
  board: EducationBoard;
  passingYear: string;
  isExpectedMarks: boolean;
  registerNumber: string;
  subjectGroup: SubjectGroup;
  mathsMarks: number;
  physicsMarks: number;
  chemistryMarks: number;
  optionalSubjectMarks: number; // Biology or Computer Science
  expectedTotalMarks: number;
  engineeringCutoff: number; // Maths/2 + Physics/4 + Chemistry/4 (max 200)
  marksheetNumber?: string;
  tcNumber?: string;
}

export interface CertificateDetails {
  aadhaarNumber: string;
  communityCertNumber: string;
  incomeCertNumber: string;
  birthCertNumber: string;
  tenthMarksheetNumber: string;
  tenthTcNumber: string;
  twelfthMarksheetNumber?: string;
  twelfthTcNumber?: string;
}

export interface AdmissionPreferences {
  admissionType: AdmissionType;
  firstChoice: string;
  secondChoice: string;
  thirdChoice: string;
}

export interface SpecialCategoryInfo {
  community: CommunityCategory;
  isGovtSchoolQuota: boolean; // Tamil Nadu 7.5% reservation for govt school students (6th to 12th)
  hasDisability: 'Yes' | 'No' | 'Prefer not to disclose';
  disabilityCategory?: string;
  disabilityPercentage?: number;
  isExServicemanChild?: boolean;
  isEminentSportsPerson?: boolean;
}

export interface UploadedDocItem {
  id: string;
  name: string;
  type: string;
  fileSize: string;
  uploadDate: string;
  previewUrl?: string;
  mockDataPayload?: Record<string, string | number>;
  extractedName?: string;
  ocrExtractedText?: string;
}

export interface ExplainableMatchField {
  fieldName: string;
  submittedValue: string;
  extractedValue: string;
  matchResult: 'MATCH' | 'MISMATCH' | 'PARTIAL' | 'NOT_APPLICABLE' | 'MANUAL_REVIEW';
  confidence: number | null; // null if uncalibrated, never hallucinated
  reason: string;
  recommendedAction: string;
  nameVerdict?: 'VERIFIED' | 'POSSIBLE_MATCH_MANUAL_REVIEW' | 'NAME_MISMATCH' | 'UNABLE_TO_VERIFY';
  nameVerdictLabel?: string;
  matchType?: string;
}

export interface DocumentVerificationReport {
  documentId: string;
  documentTitle: string;
  status: VerificationStatusColor;
  statusLabel: string;
  fields: ExplainableMatchField[];
  qrVerified: boolean;
  qrDetails?: string;
  integrityScore?: string;
  integrityAnomalies: string[];
}

export interface ComplianceCheckRule {
  ruleId: string;
  ruleTitle: string;
  authority: 'AICTE' | 'Anna University' | 'TNEA Guidelines' | 'Tamil Nadu State Govt';
  passed: boolean;
  requirement: string;
  actualStatus: string;
  details: string;
}

export interface DuplicateCheckResult {
  isDuplicateSuspected: boolean;
  matchedApplicationId?: string;
  matchedFields: string[];
  explanation: string;
}

export interface VerificationSummary {
  overallStatus: 'PASSED' | 'MANUAL_REVIEW_REQUIRED' | 'MISMATCH_DETECTED';
  overallScorePercent: number;
  documentsReport: DocumentVerificationReport[];
  complianceRules: ComplianceCheckRule[];
  duplicateCheck: DuplicateCheckResult;
  verifiedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  previousStatus?: ApplicationStatus;
  newStatus?: ApplicationStatus;
}

export interface CorrectionRequest {
  id: string;
  requestedAt: string;
  requestedBy: string;
  instructions: string;
  fieldsToFix: string[];
  resolved: boolean;
  resolvedAt?: string;
}

export interface StudentApplication {
  id: string; // e.g. EVA-2026-0101
  collegeCode: string;
  collegeName: string;
  personal: PersonalInfo;
  tenth: TenthInfo;
  twelfth: TwelfthInfo;
  certificates: CertificateDetails;
  preferences: AdmissionPreferences;
  specialCategory: SpecialCategoryInfo;
  documents: Record<string, UploadedDocItem | null>;
  verificationSummary?: VerificationSummary;
  status: ApplicationStatus;
  submissionDate: string;
  lastUpdatedDate: string;
  rejectionReason?: string;
  reviewNotes?: string;
  correctionRequest?: CorrectionRequest;
  auditTrail: AuditLogEntry[];
}

export interface CollegeDepartment {
  id: string;
  name: string;
  code: string;
  approvedIntake: number;
  allocatedSeats: number;
  counsellingQuota: number;
  managementQuota: number;
  cutoffEstimate: number;
}

export interface CollegeInfo {
  code: string;
  name: string;
  location: string;
  district: string;
  state: string;
  logoText: string;
  bannerImage: string;
  tagline: string;
  description: string;
  adminUsername: string;
  adminDisplay: string;
  adminPassword: string; // collegename@2026
  contactEmail: string;
  contactPhone: string;
  accreditation: string;
  facilities: {
    title: string;
    description: string;
    icon: string;
  }[];
  departments: CollegeDepartment[];
}
