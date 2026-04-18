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
  SCREENING = 'Screening',
  INTERVIEW_SCHEDULED = 'Interview Scheduled',
  SELECTED = 'Selected',
  REJECTED = 'Rejected',
  NOT_REQUIRED = 'Not Required',
}

export enum ApplicantStatus {
  NOT_IN_PROCESS = 'Not In Process',
  IN_PROCESS = 'In Process',
  HIRED = 'Hired',
  BANNED = 'Banned',
}
