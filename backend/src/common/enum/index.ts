export enum VacancyStatus {
  OPENED = 'Opened',
  SUSPENDED = 'Suspended',
  CLOSED = 'Closed',
}

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  HR = 'HR',
  INTERVIEWER = 'Interviewer',
  APPLICANT = 'Applicant',
}

export enum ApplicationStatus {
  PENDING = 'Pending',
  INTERVIEW_SCHEDULED = 'Interview Scheduled',
  SELECTED = 'Selected',
  REJECTED = 'Rejected',
  ACCEPTED = 'Accepted',
  NOT_REQUIRED = 'Not Required',
}

export enum ApplicantStatus {
  NOT_IN_PROCESS = 'Not In Process',
  IN_PROCESS = 'In Process',
  HIRED = 'Hired',
  BANNED = 'Banned',
}

export enum InterviewStatus {
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  POSTPONED = 'Postponed',
}

export enum TokenType {
  EMAIL_REGISTER_VERIFY = 'email_register_verify',
  EMAIL_INVITE_VERIFY = 'email_invite_verify',
  EMAIL_FORGOT_VERIFY = 'email_forgot_verify',
}
