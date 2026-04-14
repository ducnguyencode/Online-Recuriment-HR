// ==================== ENUMS ====================

export type UserRole = 'HR' | 'Interviewer' | 'Applicant';

export type VacancyStatus = 'Opened' | 'Suspended' | 'Closed';

/** Per spec: Not in Process → In Process (on first attach) → Hired (on Selected) | Banned (manual) */
export type ApplicantStatus =
  | 'Not in Process'
  | 'In Process'
  | 'Hired'
  | 'Banned';

/** Per spec application statuses */
export type ApplicationStatus =
  | 'Pending'
  | 'Screening'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected'
  | 'Not Required';

export type InterviewResult = 'Pass' | 'Fail' | 'Pending';

export type InterviewStatus =
  | 'Scheduled'
  | 'Completed'
  | 'Cancelled'
  | 'Postponed';

// ==================== MODELS ====================

export interface Department {
  id: string; // UUID
  code?: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Employee {
  id: string; // UUID
  departmentId: string;
  department?: Department;
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  role?: 'HR' | 'Interviewer';
  isActive?: boolean;
}

export interface UserAccount {
  id: string; // UUID
  email: string;
  fullName: string;
  role: UserRole;
  employeeId?: string;
  applicantId?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface Vacancy {
  id: string; // UUID — auto-generated, immutable
  code: string;
  title: string;
  description: string;
  departmentId: string;
  department?: Department;
  numberOfOpenings: number; // per spec field name
  filledCount: number;
  ownedByEmployeeId: string; // HR who created — only they can edit/close
  owner?: Employee;
  closingDate: string | null; // per spec: closingDate (not deadline)
  status: VacancyStatus;
  createdAt: string; // auto, immutable
  updatedAt: string;
}

export interface Applicant {
  id: string; // UUID
  code: string;
  fullName: string;
  email: string;
  phone: string;
  status: ApplicantStatus;
  isActive?: boolean;
  createdAt: string; // auto, immutable
  updatedAt: string;
}

export interface CV {
  id: string; // UUID
  applicantId: string;
  fileName?: string;
  fileUrl?: string;
  parsedDataAi?: {
    // camelCase matches backend (parsedDataAi)
    fullName?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    workHistory?: { company: string; role: string; duration: string }[];
    summary?: string;
  };
  createdAt: string;
}

export interface Application {
  id: string; // UUID
  applicantId: string;
  applicant?: Applicant;
  vacancyId: string;
  vacancy?: Vacancy;
  cvId?: string;
  cv?: CV;
  status: ApplicationStatus;
  aiMatchScore?: number;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewerPanel {
  employeeId: string;
  employee?: Employee;
  fullName?: string;
  role?: string;
  vote: InterviewResult;
  feedback?: string;
}

export interface Interview {
  id: string; // UUID
  applicationId: string;
  application?: Application;
  interviewDate: string;
  startTime: string;
  endTime: string;
  platform: 'Google Meet' | 'Zoom' | 'On-site';
  meetLink?: string;
  status: InterviewStatus;
  panel: InterviewerPanel[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: UserAccount;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string;
  device?: string;
  browser?: string;
  status: 'Success' | 'Failed';
  createdAt: string;
}

// ==================== API RESPONSES ====================

export interface LoginResponse {
  statusCode: number;
  message: string;
  data: {
    token: string;
    user: UserAccount;
  };
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

// ==================== DASHBOARD ====================

export interface DashboardStats {
  openVacancies: number;
  applicantsInProcess: number;
  todayInterviews: number;
  nearDeadline: number;
  totalApplications: number;
  hiringRate: number;
}

// ==================== BUSINESS RULE HELPERS ====================

/** Per spec: once Closed, cannot change status */
export function canChangeVacancyStatus(current: VacancyStatus): boolean {
  return current !== 'Closed';
}

/** Per spec: cannot attach applicant to Closed or Suspended vacancy */
export function canAttachToVacancy(vacancyStatus: VacancyStatus): boolean {
  return vacancyStatus === 'Opened';
}

/** Per spec: cannot attach more vacancies if applicant is Hired or Banned */
export function canAttachVacancyToApplicant(
  applicantStatus: ApplicantStatus,
): boolean {
  return applicantStatus !== 'Hired' && applicantStatus !== 'Banned';
}

/** Per spec: HR can only edit/close vacancies they own */
export function isVacancyOwner(
  vacancy: Vacancy,
  currentUserId: string,
): boolean {
  return vacancy.ownedByEmployeeId === currentUserId;
}

export function formatDisplayId(prefix: string, rawId?: string): string {
  if (!rawId) return '—';
  const match = rawId.match(/(\d+)(?!.*\d)/);
  const value = match ? Number(match[1]) : 0;
  return `${prefix}${value.toString().padStart(4, '0')}`;
}
