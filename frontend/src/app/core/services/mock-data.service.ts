import { Injectable } from '@angular/core';
import {
  Vacancy,
  Application,
  Applicant,
  CV,
  Department,
  ApplicationStatus,
  VacancyStatus,
  InAppNotification,
  ActivityLog,
} from '../models';

/**
 * Mock Data Service — fallback when backend is not ready.
 * All IDs are strings (simulating UUIDs). Field names match the real models.
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  private employees = [
    { id: 'emp-uuid-001', fullName: 'Nguyễn Văn An', position: 'Tech Lead' },
    { id: 'emp-uuid-002', fullName: 'Trần Thị Bình', position: 'HR Manager' },
    {
      id: 'emp-uuid-003',
      fullName: 'Lê Văn Cường',
      position: 'Senior Developer',
    },
  ];

  private departments: Department[] = [
    { id: 'dept-1', name: 'Engineering' },
    { id: 'dept-2', name: 'Marketing' },
    { id: 'dept-3', name: 'Sales' },
    { id: 'dept-4', name: 'HR' },
    { id: 'dept-5', name: 'Finance' },
    { id: 'dept-6', name: 'Design' },
  ];

  private vacancies: Vacancy[] = [
    {
      id: '1',
      code: 'V0001',
      title: 'Senior Frontend Developer',
      description:
        'React/TypeScript expert with 3+ years. Strong knowledge of State Management, Testing and CI/CD.',
      departmentId: 'dept-1',
      department: { id: 'dept-1', name: 'Engineering' },
      numberOfOpenings: 2,
      filledCount: 0,
      ownedByEmployeeId: 'emp-uuid-001',
      closingDate: this.futureDate(30),
      status: 'Opened',
      createdAt: this.pastDate(10),
      updatedAt: this.pastDate(10),
    },
    {
      id: '2',
      code: 'V0002',
      title: 'Marketing Manager',
      description:
        'Manage online/offline marketing strategy. 5+ years, proficient in Google Ads, Facebook Ads and SEO.',
      departmentId: 'dept-2',
      department: { id: 'dept-2', name: 'Marketing' },
      numberOfOpenings: 1,
      filledCount: 0,
      ownedByEmployeeId: 'emp-uuid-001',
      closingDate: this.futureDate(20),
      status: 'Opened',
      createdAt: this.pastDate(15),
      updatedAt: this.pastDate(15),
    },
    {
      id: '3',
      code: 'V0003',
      title: 'Sales Executive',
      description:
        'B2B sales, strong negotiation and presentation skills. IT industry experience preferred.',
      departmentId: 'dept-3',
      department: { id: 'dept-3', name: 'Sales' },
      numberOfOpenings: 3,
      filledCount: 1,
      ownedByEmployeeId: 'emp-uuid-002',
      closingDate: this.futureDate(10),
      status: 'Opened',
      createdAt: this.pastDate(20),
      updatedAt: this.pastDate(5),
    },
    {
      id: '4',
      code: 'V0004',
      title: 'UX Designer',
      description:
        'User experience design, proficient in Figma, with real portfolio.',
      departmentId: 'dept-6',
      department: { id: 'dept-6', name: 'Design' },
      numberOfOpenings: 1,
      filledCount: 1,
      ownedByEmployeeId: 'emp-uuid-002',
      closingDate: this.pastDate(5),
      status: 'Closed',
      createdAt: this.pastDate(30),
      updatedAt: this.pastDate(2),
    },
    {
      id: '5',
      code: 'V0005',
      title: 'Finance Analyst',
      description:
        'Financial analysis, reporting, forecasting. CFA Level 1+ is a plus.',
      departmentId: 'dept-5',
      department: { id: 'dept-5', name: 'Finance' },
      numberOfOpenings: 2,
      filledCount: 0,
      ownedByEmployeeId: 'emp-uuid-001',
      closingDate: this.futureDate(15),
      status: 'Suspended',
      createdAt: this.pastDate(12),
      updatedAt: this.pastDate(3),
    },
    {
      id: '6',
      code: 'V0006',
      title: 'Backend Engineer',
      description:
        'API development, microservices. Node.js/NestJS, PostgreSQL, Docker required.',
      departmentId: 'dept-1',
      department: { id: 'dept-1', name: 'Engineering' },
      numberOfOpenings: 2,
      filledCount: 0,
      ownedByEmployeeId: 'emp-uuid-002',
      closingDate: this.futureDate(25),
      status: 'Opened',
      createdAt: this.pastDate(8),
      updatedAt: this.pastDate(8),
    },
    {
      id: '7',
      code: 'V0007',
      title: 'HR Business Partner',
      description:
        'HR strategy consulting, support departments in recruitment and people development.',
      departmentId: 'dept-4',
      department: { id: 'dept-4', name: 'HR' },
      numberOfOpenings: 1,
      filledCount: 0,
      ownedByEmployeeId: 'emp-uuid-001',
      closingDate: this.futureDate(18),
      status: 'Opened',
      createdAt: this.pastDate(6),
      updatedAt: this.pastDate(6),
    },
    {
      id: '8',
      code: 'V0008',
      title: 'DevOps Engineer',
      description:
        'Cloud infrastructure (AWS/GCP), CI/CD pipelines, monitoring. Kubernetes experience is a plus.',
      departmentId: 'dept-1',
      department: { id: 'dept-1', name: 'Engineering' },
      numberOfOpenings: 1,
      filledCount: 0,
      ownedByEmployeeId: 'emp-uuid-002',
      closingDate: this.futureDate(22),
      status: 'Opened',
      createdAt: this.pastDate(4),
      updatedAt: this.pastDate(4),
    },
  ];

  private applicants: Applicant[] = [
    {
      id: '1',
      code: 'A0001',
      fullName: 'Hoang Minh Tuan',
      email: 'tuan.hoang@gmail.com',
      phone: '0901234567',
      status: 'In Process',
      createdAt: this.pastDate(9),
      updatedAt: this.pastDate(9),
    },
    {
      id: '2',
      code: 'A0002',
      fullName: 'Vo Thi Lan',
      email: 'lan.vo@gmail.com',
      phone: '0912345678',
      status: 'In Process',
      createdAt: this.pastDate(8),
      updatedAt: this.pastDate(8),
    },
    {
      id: '3',
      code: 'A0003',
      fullName: 'Bui Duc Manh',
      email: 'manh.bui@gmail.com',
      phone: '0923456789',
      status: 'Hired',
      createdAt: this.pastDate(25),
      updatedAt: this.pastDate(2),
    },
    {
      id: '4',
      code: 'A0004',
      fullName: 'Nguyen Thi Hoa',
      email: 'hoa.nguyen@gmail.com',
      phone: '0934567890',
      status: 'Not in Process',
      createdAt: this.pastDate(5),
      updatedAt: this.pastDate(5),
    },
    {
      id: '5',
      code: 'A0005',
      fullName: 'Dang Van Khoa',
      email: 'khoa.dang@gmail.com',
      phone: '0945678901',
      status: 'In Process',
      createdAt: this.pastDate(7),
      updatedAt: this.pastDate(7),
    },
    {
      id: '6',
      code: 'A0006',
      fullName: 'Ly Thi Mai',
      email: 'mai.ly@gmail.com',
      phone: '0956789012',
      status: 'Banned',
      createdAt: this.pastDate(20),
      updatedAt: this.pastDate(10),
    },
    {
      id: '7',
      code: 'A0007',
      fullName: 'Tran Van Nam',
      email: 'nam.tran@gmail.com',
      phone: '0967890123',
      status: 'In Process',
      createdAt: this.pastDate(6),
      updatedAt: this.pastDate(6),
    },
    {
      id: '8',
      code: 'A0008',
      fullName: 'Phan Thi Oanh',
      email: 'oanh.phan@gmail.com',
      phone: '0978901234',
      status: 'Not in Process',
      createdAt: this.pastDate(3),
      updatedAt: this.pastDate(3),
    },
  ];

  private cvs: CV[] = [
    {
      id: 'cv-1',
      applicantId: 'appl-1',
      fileName: 'HoangMinhTuan_CV.pdf',
      fileUrl: '/uploads/cv/1.pdf',
      parsedDataAi: {
        fullName: 'Hoang Minh Tuan',
        email: 'tuan.hoang@gmail.com',
        skills: ['React', 'TypeScript', 'Node.js', 'Angular', 'TailwindCSS'],
        experience: '3 years',
        education: 'HCMUT - Computer Science',
        summary:
          'Frontend developer with 3 years React experience, passionate about beautiful and high-performance UIs.',
      },
      createdAt: this.pastDate(9),
    },
    {
      id: 'cv-2',
      applicantId: 'appl-2',
      fileName: 'VoThiLan_CV.pdf',
      fileUrl: '/uploads/cv/2.pdf',
      parsedDataAi: {
        fullName: 'Vo Thi Lan',
        email: 'lan.vo@gmail.com',
        skills: ['Marketing', 'Google Ads', 'Facebook Ads', 'Content Writing'],
        experience: '4 years',
        education: 'UEH - Marketing',
        summary:
          'Marketing specialist, proficient in Google Ads and Social Media strategy.',
      },
      createdAt: this.pastDate(8),
    },
    {
      id: 'cv-3',
      applicantId: 'appl-3',
      fileName: 'BuiDucManh_CV.pdf',
      fileUrl: '/uploads/cv/3.pdf',
      parsedDataAi: {
        fullName: 'Bui Duc Manh',
        email: 'manh.bui@gmail.com',
        skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research', 'Prototyping'],
        experience: '5 years',
        education: 'FPT University - Graphic Design',
        summary:
          'Senior UX Designer with 5 years experience, specialising in B2B SaaS products.',
      },
      createdAt: this.pastDate(25),
    },
    {
      id: 'cv-4',
      applicantId: 'appl-5',
      fileName: 'DangVanKhoa_CV.pdf',
      fileUrl: '/uploads/cv/4.pdf',
      parsedDataAi: {
        fullName: 'Dang Van Khoa',
        email: 'khoa.dang@gmail.com',
        skills: ['Python', 'Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
        experience: '2 years',
        education: 'VNU - Software Engineering',
        summary:
          'Backend developer with REST API and microservices experience.',
      },
      createdAt: this.pastDate(7),
    },
    {
      id: 'cv-5',
      applicantId: 'appl-7',
      fileName: 'TranVanNam_CV.pdf',
      fileUrl: '/uploads/cv/5.pdf',
      parsedDataAi: {
        fullName: 'Tran Van Nam',
        email: 'nam.tran@gmail.com',
        skills: ['Node.js', 'NestJS', 'MongoDB', 'GraphQL', 'AWS'],
        experience: '3 years',
        education: 'HCMUS - Computer Science',
        summary:
          'Full-stack developer, proficient in NestJS & React, experienced with AWS deployments.',
      },
      createdAt: this.pastDate(6),
    },
  ];

  private applications: Application[] = [
    {
      id: 'appl-id-1',
      applicantId: 'appl-1',
      vacancyId: '1',
      cvId: 'cv-1',
      status: 'Interview Scheduled',
      aiMatchScore: 88,
      createdAt: this.pastDate(8),
      updatedAt: this.pastDate(6),
    },
    {
      id: 'appl-id-2',
      applicantId: 'appl-2',
      vacancyId: '2',
      cvId: 'cv-2',
      status: 'Screening',
      aiMatchScore: 82,
      createdAt: this.pastDate(7),
      updatedAt: this.pastDate(7),
    },
    {
      id: 'appl-id-3',
      applicantId: 'appl-1',
      vacancyId: '3',
      cvId: 'cv-1',
      status: 'Pending',
      aiMatchScore: 45,
      createdAt: this.pastDate(7),
      updatedAt: this.pastDate(7),
    },
    {
      id: 'appl-id-4',
      applicantId: 'appl-3',
      vacancyId: '4',
      cvId: 'cv-3',
      status: 'Selected',
      aiMatchScore: 95,
      createdAt: this.pastDate(20),
      updatedAt: this.pastDate(2),
    },
    {
      id: 'appl-id-5',
      applicantId: 'appl-5',
      vacancyId: '2',
      cvId: 'cv-4',
      status: 'Screening',
      aiMatchScore: 52,
      createdAt: this.pastDate(6),
      updatedAt: this.pastDate(4),
    },
    {
      id: 'appl-id-6',
      applicantId: 'appl-7',
      vacancyId: '6',
      cvId: 'cv-5',
      status: 'Interview Scheduled',
      aiMatchScore: 91,
      createdAt: this.pastDate(5),
      updatedAt: this.pastDate(3),
    },
    {
      id: 'appl-id-7',
      applicantId: 'appl-5',
      vacancyId: '6',
      cvId: 'cv-4',
      status: 'Pending',
      aiMatchScore: 60,
      createdAt: this.pastDate(5),
      updatedAt: this.pastDate(5),
    },
    {
      id: 'appl-id-8',
      applicantId: 'appl-8',
      vacancyId: '1',
      status: 'Pending',
      aiMatchScore: 72,
      createdAt: this.pastDate(3),
      updatedAt: this.pastDate(3),
    },
    {
      id: 'appl-id-9',
      applicantId: 'appl-4',
      vacancyId: '7',
      status: 'Rejected',
      aiMatchScore: 35,
      createdAt: this.pastDate(4),
      updatedAt: this.pastDate(1),
    },
    {
      id: 'appl-id-10',
      applicantId: 'appl-2',
      vacancyId: '1',
      cvId: 'cv-2',
      status: 'Screening',
      aiMatchScore: 68,
      createdAt: this.pastDate(2),
      updatedAt: this.pastDate(2),
    },
  ];

  private interviewerAvailability = [
    {
      id: 'slot-1',
      employeeId: 'emp-uuid-001',
      availableDate: this.futureDate(1),
      startTime: '09:00',
      endTime: '11:00',
      isBooked: false,
    },
    {
      id: 'slot-2',
      employeeId: 'emp-uuid-001',
      availableDate: this.futureDate(1),
      startTime: '14:00',
      endTime: '16:00',
      isBooked: false,
    },
    {
      id: 'slot-3',
      employeeId: 'emp-uuid-003',
      availableDate: this.futureDate(1),
      startTime: '09:00',
      endTime: '12:00',
      isBooked: false,
    },
    {
      id: 'slot-4',
      employeeId: 'emp-uuid-003',
      availableDate: this.futureDate(2),
      startTime: '13:00',
      endTime: '16:00',
      isBooked: false,
    },
    {
      id: 'slot-5',
      employeeId: 'emp-uuid-002',
      availableDate: this.futureDate(2),
      startTime: '08:30',
      endTime: '11:30',
      isBooked: false,
    },
  ];

  private notifications: InAppNotification[] = [
    {
      id: 'noti-1',
      userId: 'uuid-hr-01',
      title: 'New application received',
      message: 'Hoang Minh Tuan applied for Senior Frontend Developer.',
      type: 'INFO',
      linkUrl: '/hr-portal/applications',
      isRead: false,
      createdAt: this.pastDateTime(0, 2),
    },
    {
      id: 'noti-2',
      userId: 'uuid-hr-01',
      title: 'Interview scheduled',
      message:
        'Interview invitation has been sent to the applicant and panel members.',
      type: 'SUCCESS',
      linkUrl: '/hr-portal/interviews',
      isRead: false,
      createdAt: this.pastDateTime(0, 5),
    },
    {
      id: 'noti-3',
      userId: 'uuid-hr-01',
      title: 'Vacancy closing soon',
      message: 'Backend Engineer vacancy is approaching its closing date.',
      type: 'WARNING',
      linkUrl: '/hr-portal/vacancies',
      isRead: true,
      createdAt: this.pastDateTime(1, 4),
    },
  ];

  private activityLogs: ActivityLog[] = [
    {
      id: 'log-1',
      userId: 'uuid-hr-01',
      action: 'CREATE_VACANCY',
      entityType: 'Vacancy',
      entityId: '8',
      details: 'Created DevOps Engineer vacancy.',
      createdAt: this.pastDateTime(0, 6),
    },
    {
      id: 'log-2',
      userId: 'uuid-hr-01',
      action: 'ATTACH_APPLICANT',
      entityType: 'Application',
      entityId: 'appl-id-10',
      details: 'Attached applicant A0002 to vacancy V0001.',
      createdAt: this.pastDateTime(1, 1),
    },
    {
      id: 'log-3',
      userId: 'uuid-iv-01',
      action: 'SUBMIT_RESULT',
      entityType: 'Interview',
      entityId: 'inv-3',
      details: 'Submitted Pass result for completed interview.',
      createdAt: this.pastDateTime(2, 3),
    },
  ];

  // ====== DEPARTMENTS ======
  getDepartments(): Department[] {
    return [...this.departments];
  }

  addDepartment(name: string): Department {
    const newId = `dept-${this.departments.length + 1}`;
    const dept: Department = { id: newId, name };
    this.departments.push(dept);
    return dept;
  }

  // ====== VACANCIES ======
  getVacancies(params?: {
    status?: string;
    search?: string;
    departmentId?: string;
  }): Vacancy[] {
    let result = [...this.vacancies];
    if (params?.status)
      result = result.filter((v) => v.status === params.status);
    if (params?.departmentId)
      result = result.filter((v) => v.departmentId === params.departmentId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q),
      );
    }
    return result;
  }

  getVacancyById(id: string): Vacancy | undefined {
    return this.vacancies.find((v) => v.id === id);
  }

  addVacancy(data: {
    title: string;
    description: string;
    departmentId: string;
    numberOfOpenings?: number;
    closingDate?: string;
  }): Vacancy {
    const newId = `${this.vacancies.length + 1}`;
    const code = `V${newId.padStart(4, '0')}`;
    const dept = this.departments.find((d) => d.id === data.departmentId);
    const vacancy: Vacancy = {
      id: newId,
      code: code,
      title: data.title,
      description: data.description,
      departmentId: data.departmentId,
      department: dept,
      numberOfOpenings: data.numberOfOpenings ?? 1,
      filledCount: 0,
      ownedByEmployeeId: 'emp-uuid-001',
      closingDate: data.closingDate ?? this.futureDate(30),
      status: 'Opened',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.vacancies.unshift(vacancy);
    return vacancy;
  }

  updateVacancy(id: string, data: Partial<Vacancy>): Vacancy | undefined {
    const idx = this.vacancies.findIndex((v) => v.id === id);
    if (idx === -1) return undefined;
    const dept = data.departmentId
      ? this.departments.find((d) => d.id === data.departmentId)
      : this.vacancies[idx].department;
    this.vacancies[idx] = {
      ...this.vacancies[idx],
      ...data,
      department: dept,
      updatedAt: new Date().toISOString(),
    };
    return this.vacancies[idx];
  }

  updateVacancyStatus(id: string, status: VacancyStatus): Vacancy | undefined {
    return this.updateVacancy(id, { status });
  }

  // ====== APPLICATIONS ======
  getApplications(params?: {
    vacancyId?: string;
    status?: ApplicationStatus;
  }): Application[] {
    let result = this.applications.map((app) => ({
      ...app,
      applicant: this.applicants.find((a) => a.id === app.applicantId),
      vacancy: this.vacancies.find((v) => v.id === app.vacancyId),
      cv: this.cvs.find((c) => c.id === app.cvId),
    }));
    if (params?.vacancyId)
      result = result.filter((a) => a.vacancyId === params.vacancyId);
    if (params?.status)
      result = result.filter((a) => a.status === params.status);
    return result;
  }

  // ====== APPLICANTS ======
  getApplicants(params?: { status?: string; search?: string }): Applicant[] {
    let result = [...this.applicants];
    if (params?.status) {
      result = result.filter((applicant) => applicant.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter((applicant) => {
        const applicantApplications = this.getApplications().filter(
          (app) => app.applicantId === applicant.id,
        );
        return (
          applicant.id.toLowerCase().includes(q) ||
          applicant.fullName.toLowerCase().includes(q) ||
          applicant.email.toLowerCase().includes(q) ||
          applicantApplications.some(
            (app) =>
              app.vacancyId.toLowerCase().includes(q) ||
              (app.vacancy?.title ?? '').toLowerCase().includes(q),
          )
        );
      });
    }
    return result;
  }

  getApplicantApplications(applicantId: string): Application[] {
    return this.getApplications().filter(
      (item) => item.applicantId === applicantId,
    );
  }

  getApplicantById(id: string): Applicant | undefined {
    return this.applicants.find((applicant) => applicant.id === id);
  }

  addApplicant(data: {
    fullName: string;
    email: string;
    phone: string;
  }): Applicant {
    let id = `${this.applicants.length + 1}`;
    let code = `A${id.padStart(4, '0')}`;
    const applicant: Applicant = {
      id: id,
      code: code,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      status: 'Not in Process',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applicants.unshift(applicant);
    return applicant;
  }

  updateApplicant(id: string, data: Partial<Applicant>): Applicant | undefined {
    const idx = this.applicants.findIndex((applicant) => applicant.id === id);
    if (idx === -1) return undefined;
    this.applicants[idx] = {
      ...this.applicants[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.applicants[idx];
  }

  updateApplicantStatus(
    id: string,
    status: Applicant['status'],
  ): Applicant | undefined {
    return this.updateApplicant(id, { status });
  }

  getCvByApplicantId(applicantId: string): CV | undefined {
    return this.cvs.find((cv) => cv.applicantId === applicantId);
  }

  attachApplicantToVacancy(data: {
    applicantId: string;
    vacancyId: string;
    cvId?: string;
  }): Application {
    const applicant = this.getApplicantById(data.applicantId);
    const cv = data.cvId
      ? this.cvs.find((item) => item.id === data.cvId)
      : this.getCvByApplicantId(data.applicantId);
    const application: Application = {
      id: `appl-id-${this.applications.length + 1}`,
      applicantId: data.applicantId,
      vacancyId: data.vacancyId,
      cvId: cv?.id,
      status: 'Pending',
      aiMatchScore: Math.floor(Math.random() * 40) + 55,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applications.unshift(application);
    if (applicant && applicant.status === 'Not in Process') {
      this.updateApplicantStatus(applicant.id, 'In Process');
    }
    return application;
  }

  updateApplicationStatus(id: string, status: string): Application | undefined {
    const idx = this.applications.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.applications[idx] = {
      ...this.applications[idx],
      status: status as ApplicationStatus,
      updatedAt: new Date().toISOString(),
    };
    const appId = this.applications[idx].applicantId;
    const appcIdx = this.applicants.findIndex((a) => a.id === appId);
    if (appcIdx > -1) {
      this.applicants[appcIdx] = {
        ...this.applicants[appcIdx],
        status: status === 'Selected' ? 'Hired' : 'In Process',
      };
    }
    return this.applications[idx];
  }

  addApplicationManual(data: {
    fullName: string;
    email: string;
    phone: string;
    vacancyId: string;
    cvSummary: string;
  }): Application {
    const newApplId = `appl-${this.applicants.length + 1}`;
    const newApplCode = `A${newApplId.padStart(4, '0')}`;
    const newCvId = `cv-${this.cvs.length + 1}`;
    const newAppId = `appl-id-${this.applications.length + 1}`;

    const applicant: Applicant = {
      id: newApplId,
      code: newApplCode,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      status: 'In Process',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applicants.unshift(applicant);

    const cv: CV = {
      id: newCvId,
      applicantId: newApplId,
      fileName: data.fullName.replace(/\s+/g, '') + '_CV.pdf',
      fileUrl: '/uploads/cv/' + newCvId + '.pdf',
      parsedDataAi: {
        fullName: data.fullName,
        email: data.email,
        summary: data.cvSummary || 'Manually created',
        skills: [],
      },
      createdAt: new Date().toISOString(),
    };
    this.cvs.unshift(cv);

    const application: Application = {
      id: newAppId,
      applicantId: newApplId,
      vacancyId: data.vacancyId,
      cvId: newCvId,
      status: 'Pending',
      aiMatchScore: Math.floor(Math.random() * 40) + 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applications.unshift(application);
    return application;
  }

  // ====== INTERVIEWS ======
  private interviews: any[] = [
    // appl-id-1: Hoang Minh Tuan → Senior Frontend Developer (Interview Scheduled ✓)
    {
      id: 'inv-1',
      applicationId: 'appl-id-1',
      date: this.futureDate(1),
      startTime: '09:00',
      endTime: '10:00',
      platform: 'Google Meet',
      meetLink: 'https://meet.google.com/abc-def',
      status: 'Scheduled',
      panel: [
        {
          employeeId: 'emp-uuid-001',
          fullName: 'Nguyen Van An',
          role: 'Tech Lead',
          vote: 'Pending',
        },
        {
          employeeId: 'emp-uuid-002',
          fullName: 'Tran Thi Binh',
          role: 'HR',
          vote: 'Pending',
        },
      ],
    },
    // appl-id-6: Tran Van Nam → Backend Engineer (Interview Scheduled ✓)
    {
      id: 'inv-2',
      applicationId: 'appl-id-6',
      date: this.futureDate(2),
      startTime: '14:00',
      endTime: '15:00',
      platform: 'Zoom',
      meetLink: 'https://zoom.us/j/123456',
      status: 'Scheduled',
      panel: [
        {
          employeeId: 'emp-uuid-003',
          fullName: 'Le Van Cuong',
          role: 'Senior Developer',
          vote: 'Pending',
        },
      ],
    },
    // appl-id-4: Bui Duc Manh → UX Designer (Completed — Selected ✓)
    {
      id: 'inv-3',
      applicationId: 'appl-id-4',
      date: this.pastDate(5),
      startTime: '09:00',
      endTime: '10:00',
      platform: 'On-site',
      meetLink: '',
      status: 'Completed',
      panel: [
        {
          employeeId: 'emp-uuid-001',
          fullName: 'Nguyen Van An',
          role: 'Tech Lead',
          vote: 'Pass',
          feedback: 'Excellent UX portfolio and strong design thinking.',
        },
      ],
    },
  ];

  getInterviews() {
    return this.interviews
      .map((inv) => {
        const app = this.getApplications().find(
          (a) => a.id === inv.applicationId,
        );
        // Use stored date/startTime/endTime directly — avoid UTC timezone shift
        const date = inv.date ?? inv.scheduledAt?.substring(0, 10) ?? '';
        const startTime = inv.startTime ?? inv.time ?? '';
        const endTime = inv.endTime ?? '';
        return {
          ...inv,
          applicantName: app?.applicant?.fullName ?? 'N/A',
          applicantEmail: app?.applicant?.email ?? '',
          vacancyTitle: app?.vacancy?.title ?? 'N/A',
          date,
          startTime,
          endTime,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addInterview(data: {
    applicationId: string;
    date: string;
    time: string;
    duration: number;
    platform: string;
    interviewers: string[];
  }) {
    const newId = `inv-${this.interviews.length + 1}`;
    const endMinutes = this.timeToMinutes(data.time) + data.duration;
    const endTime = this.minutesToTime(endMinutes);
    this.updateApplicationStatus(data.applicationId, 'Interview Scheduled');
    const newInterview = {
      id: newId,
      applicationId: data.applicationId,
      date: data.date,
      startTime: data.time,
      endTime,
      platform: data.platform,
      meetLink:
        data.platform === 'On-site'
          ? ''
          : 'https://meet.google.com/' +
            Math.random().toString(36).substring(7),
      status: 'Scheduled',
    };
    this.interviews.unshift(newInterview);
    this.interviewerAvailability = this.interviewerAvailability.map((slot) => {
      if (
        data.interviewers.includes(slot.employeeId) &&
        slot.availableDate === data.date
      ) {
        const booked = data.time >= slot.startTime && data.time < slot.endTime;
        return booked ? { ...slot, isBooked: true } : slot;
      }
      return slot;
    });
    return newInterview;
  }

  /** Returns names of interviewers who already have a conflicting interview on the same date+time */
  getInterviewerConflicts(
    employeeIds: string[],
    date: string,
    startTime: string,
    endTime: string,
    excludeInterviewId?: string,
  ): string[] {
    return employeeIds
      .filter((empId) =>
        this.interviews.some((inv) => {
          if (excludeInterviewId && inv.id === excludeInterviewId) return false;
          if (inv.date !== date) return false;
          const panel: any[] = Array.isArray(inv.panel) ? inv.panel : [];
          if (!panel.some((p: any) => p.employeeId === empId)) return false;
          // Overlap: startA < endB && endA > startB
          return startTime < inv.endTime && endTime > inv.startTime;
        }),
      )
      .map(
        (empId) =>
          this.employees.find((e) => e.id === empId)?.fullName ?? empId,
      );
  }

  // ====== AVAILABILITY ======
  getAvailability(employeeId: string, startDate: string, endDate: string) {
    return this.interviewerAvailability.filter(
      (slot) =>
        slot.employeeId === employeeId &&
        slot.availableDate >= startDate &&
        slot.availableDate <= endDate &&
        !slot.isBooked,
    );
  }

  // ====== NOTIFICATIONS ======
  getNotifications(params?: { isRead?: boolean }) {
    let result = [...this.notifications];
    if (params?.isRead !== undefined) {
      result = result.filter((item) => item.isRead === params.isRead);
    }
    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  markNotificationRead(id: string) {
    this.notifications = this.notifications.map((item) =>
      item.id === id ? { ...item, isRead: true } : item,
    );
  }

  markAllNotificationsRead() {
    this.notifications = this.notifications.map((item) => ({
      ...item,
      isRead: true,
    }));
  }

  // ====== AUDIT LOGS ======
  getActivityLogs() {
    return [...this.activityLogs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // ====== DASHBOARD STATS ======
  getDashboardStats() {
    const openVacancies = this.vacancies.filter(
      (v) => v.status === 'Opened',
    ).length;
    const totalApplications = this.applications.length;
    const inProcess = this.applications.filter(
      (a) => !['Selected', 'Rejected'].includes(a.status),
    ).length;
    const selected = this.applications.filter(
      (a) => a.status === 'Selected',
    ).length;
    return {
      openVacancies,
      totalApplications,
      applicantsInProcess: inProcess,
      todayInterviews: 3,
      nearDeadline: 2,
      hiringRate:
        totalApplications > 0
          ? Math.round((selected / totalApplications) * 100)
          : 0,
    };
  }

  // ====== UTILS ======
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private futureDate(days: number): string {
    return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
  }
  private pastDate(days: number): string {
    return new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  }

  private pastDateTime(days: number, hours: number): string {
    return new Date(
      Date.now() - days * 86400000 - hours * 3600000,
    ).toISOString();
  }
}
