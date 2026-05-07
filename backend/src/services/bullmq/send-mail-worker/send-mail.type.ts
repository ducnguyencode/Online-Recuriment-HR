export interface SendMailJobData {
  email: string;
  name: string;
  subject: string;
  detail: {
    position: string;
    company: string;
    startDate: string;
    department: string;
  };
}
