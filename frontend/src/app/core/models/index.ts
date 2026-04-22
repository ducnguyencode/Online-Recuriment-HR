// ==================== ENUMS ====================

export type UserRole = 'HR' | 'Interviewer' | 'Applicant' | 'Superadmin';

export type VacancyStatus =
  | 'Open'
  | 'Opened'
  | 'Suspended'
  | 'Close'
  | 'Closed';

export type ApplicantStatus =
  | 'Not In Process'
  | 'In Process'
  | 'Hired'
  | 'Banned';

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
  id: string;
  code?: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Employee {
  id: string;
  departmentId: string;
  department?: Department;
  fullName: string;
  email: string;
  phone?: string;
  position?: string; // Giữ lại cho Đức xài
  jobTitle?: string; // Khang xài (từ ERD)
  role?: 'HR' | 'Interviewer';
  isActive?: boolean;
  createdAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  employeeId?: string;
  applicantId?: string;
  avatarUrl?: string;
  resetPasswordToken?: string;
  resetTokenExpiry?: string;
  mustChangePassword?: boolean;
  passwordChangedAt?: string;
  createdByUserId?: string;
  isActive: boolean;
}

export interface Vacancy {
  id: string;
  code: string;
  title: string;
  description: string;
  departmentId: string;
  department?: Department;
  numberOfOpenings: number;
  filledCount: number;
  ownedByEmployeeId: string;
  owner?: Employee;
  closingDate: string | null;
  status: VacancyStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Applicant {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  linkedInProfile?: string;
  status: ApplicantStatus;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CV {
  id: string;
  applicantId: string;
  fileName?: string;
  fileUrl?: string;
  yearsOfExperience?: number;
  highestQualification?: string;
  isDefault?: boolean;
  parsedDataAi?: {
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

export interface AiPreview {
  cvData: {
    fullName?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    workHistory?: { company: string; role: string; duration: string }[];
    summary?: string;
  };
  matchScore: number;
  sumaryAnalysis: string;
}

export interface Application {
  id: string;
  code?: string;
  applicantId: string;
  applicant?: Applicant;
  vacancyId: string;
  vacancy?: Vacancy;
  cvId?: string;
  cv?: CV;
  status: ApplicationStatus;
  aiPreview?: AiPreview;
  aiMatchScore?: number;
  hrNotes?: string;
  appliedAt?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface InterviewerPanel {
  id?: string;
  interviewId?: string;
  employeeId: string;
  employee?: Employee;
  fullName?: string;
  role?: string;
  vote: InterviewResult;
  feedback?: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  application?: Application;
  applicant?: Applicant;
  vacancy?: Vacancy;
  interviewDate: string; // Đã bỏ optional để khỏi báo đỏ Type 'string | undefined'
  startTime: string;
  endTime: string;
  platform: 'Google Meet' | 'Zoom' | 'Teams' | 'On-site';
  meetLink?: string;
  status: InterviewStatus;
  finalResult?: string;
  panel: InterviewerPanel[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: UserAccount;
  action: string; // Giữ lại cho Đức
  actionType?: string; // Khang xài (từ ERD)
  details?: string; // Giữ lại cho Đức
  description?: string; // Khang xài (từ ERD)
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string; // Giữ lại cho Đức (Mặc dù ERD không có)
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string;
  device?: string; // Giữ lại cho Đức
  deviceInfo?: string; // Khang xài
  browser?: string;
  status?: 'Success' | 'Failed'; // Giữ lại cho Đức
  isSuccess?: boolean; // Khang xài
  loginTime?: string;
  createdAt?: string;
}

// ==================== NEW ENTITIES TỪ ERD ====================

export interface FavoriteJob {
  id: string;
  applicantId: string;
  vacancyId: string;
  hasApplied: boolean;
  savedAt: string;
}

export interface Skill {
  id: string;
  skillName: string;
  category: 'Tech' | 'SoftSkill' | 'Language';
}

export interface VacancySkill {
  vacancyId: string;
  skillId: string;
  priorityLevel: number;
}

export interface CvSkill {
  cvId: string;
  skillId: string;
  yearsUsed: number;
}

export interface InterviewerAvailability {
  id: string;
  employeeId: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface EmailQueue {
  id: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  status: 'Pending' | 'Sent' | 'Failed';
  emailType: 'Invite' | 'Register' | 'Result' | 'StaffWelcome';
  retryCount: number;
  scheduledAt: string;
  sentAt?: string;
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
  totalItems?: number;
  totalPage?: number;
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

export function canChangeVacancyStatus(current: VacancyStatus): boolean {
  return current !== 'Closed' && current !== 'Close';
}

export function canAttachToVacancy(vacancyStatus: VacancyStatus): boolean {
  return vacancyStatus === 'Opened' || vacancyStatus === 'Open';
}

export function canAttachVacancyToApplicant(
  applicantStatus: ApplicantStatus,
): boolean {
  return applicantStatus !== 'Hired' && applicantStatus !== 'Banned';
}

export function displayApplicantStatus(status?: string): string {
  if (!status) return '—';
  if (status === 'Not In Process') return 'Not in Process';
  return status;
}

export function isVacancyOpenStatus(status?: string): boolean {
  return status === 'Open' || status === 'Opened';
}

export function isVacancyClosedStatus(status?: string): boolean {
  return status === 'Close' || status === 'Closed';
}

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
