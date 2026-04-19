/* eslint-disable @typescript-eslint/no-misused-promises */
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole, VacancyStatus } from 'src/common/enum';
import { Department } from 'src/entities/department.entity';
import { Repository } from 'typeorm';
import * as bycrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';
import { Vacancy } from 'src/entities/vacancy.entity';

export class Seed {
  constructor(
    @InjectRepository(Department)
    private departmentTable: Repository<Department>,
    @InjectRepository(User)
    private userTable: Repository<User>,
    @InjectRepository(Vacancy)
    private vacancyTable: Repository<Vacancy>,
  ) {}

  private departments = [
    { id: 1, name: 'Engineering' },
    { id: 2, name: 'Marketing' },
    { id: 3, name: 'Sales' },
    { id: 4, name: 'HR' },
    { id: 5, name: 'Finance' },
    { id: 6, name: 'Design' },
  ];

  private users = [
    {
      id: 1,
      fullName: UserRole.SUPER_ADMIN,
      role: UserRole.SUPER_ADMIN,
      email: 'admin@test.com',
      password: bycrypt.hashSync('123456', 10),
    },
    {
      id: 2,
      fullName: UserRole.HR,
      role: UserRole.HR,
      email: 'hr@test.com',
      password: bycrypt.hashSync('123456', 10),
    },
    {
      id: 3,
      fullName: UserRole.INTERVIEWER,
      role: UserRole.INTERVIEWER,
      email: 'interviewer@test.com',
      password: bycrypt.hashSync('123456', 10),
    },
    {
      id: 4,
      fullName: UserRole.APPLICANT,
      role: UserRole.APPLICANT,
      email: 'applicant@test.com',
      password: bycrypt.hashSync('123456', 10),
    },
  ];

  private vacancies = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      description:
        'React/TypeScript expert with 3+ years. Strong knowledge of State Management, Testing and CI/CD.',
      departmentId: 1,
      numberOfOpenings: 2,
      createdById: 1,
      closingDate: new Date(
        Date.now() + Math.floor(Math.random() * 10) * 86400000,
      )
        .toISOString()
        .split('T')[0],
      status: VacancyStatus.OPENED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 2,
      title: 'Marketing Manager',
      description:
        'Manage online/offline marketing strategy. 5+ years, proficient in Google Ads, Facebook Ads and SEO.',
      departmentId: 2,
      numberOfOpenings: 1,
      filledCount: 0,
      createdById: 1,
      closingDate: new Date(
        Date.now() + Math.floor(Math.random() * 10) * 86400000,
      )
        .toISOString()
        .split('T')[0],
      status: VacancyStatus.OPENED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 3,
      title: 'Sales Executive',
      description:
        'B2B sales, strong negotiation and presentation skills. IT industry experience preferred.',
      departmentId: 3,
      numberOfOpenings: 3,
      filledCount: 1,
      createdById: 2,
      closingDate: new Date(
        Date.now() + Math.floor(Math.random() * 10) * 86400000,
      )
        .toISOString()
        .split('T')[0],
      status: VacancyStatus.OPENED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 4,
      title: 'UX Designer',
      description:
        'User experience design, proficient in Figma, with real portfolio.',
      departmentId: 6,
      numberOfOpenings: 1,
      filledCount: 1,
      createdById: 2,
      closingDate: new Date(
        Date.now() + Math.floor(Math.random() * 10) * 86400000,
      )
        .toISOString()
        .split('T')[0],
      status: VacancyStatus.CLOSED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 5,
      title: 'Finance Analyst',
      description:
        'Financial analysis, reporting, forecasting. CFA Level 1+ is a plus.',
      departmentId: 5,
      numberOfOpenings: 2,
      filledCount: 0,
      createdById: 1,
      closingDate: new Date(
        Date.now() + Math.floor(Math.random() * 10) * 86400000,
      )
        .toISOString()
        .split('T')[0],
      status: VacancyStatus.SUSPENDED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 6,
      title: 'Backend Engineer',
      description:
        'API development, microservices. Node.js/NestJS, PostgreSQL, Docker required.',
      departmentId: 1,
      numberOfOpenings: 2,
      filledCount: 0,
      createdById: 2,
      closingDate: new Date(
        Date.now() + Math.floor(Math.random() * 10) * 86400000,
      )
        .toISOString()
        .split('T')[0],
      status: VacancyStatus.OPENED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 7,
      title: 'HR Business Partner',
      description:
        'HR strategy consulting, support departments in recruitment and people development.',
      departmentId: 4,
      numberOfOpenings: 1,
      filledCount: 0,
      createdById: 1,
      closingDate: new Date(
        Date.now() + Math.floor(Math.random() * 10) * 86400000,
      )
        .toISOString()
        .split('T')[0],
      status: VacancyStatus.OPENED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 8,
      title: 'DevOps Engineer',
      description:
        'Cloud infrastructure (AWS/GCP), CI/CD pipelines, monitoring. Kubernetes experience is a plus.',
      departmentId: 1,
      numberOfOpenings: 1,
      filledCount: 0,
      createdById: 2,
      closingDate: new Date(
        Date.now() + Math.floor(Math.random() * 10) * 86400000,
      )
        .toISOString()
        .split('T')[0],
      status: VacancyStatus.OPENED,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    },
  ];

  async seedUser() {
    for (const user of this.users) {
      const exists = await this.userTable.findOne({
        where: { email: user.email },
      });

      if (!exists) {
        await this.userTable.save(user);
      }
    }

    await this.departmentTable.query(`
        SELECT setval(
            pg_get_serial_sequence('users', 'id'),
            (SELECT MAX(id) FROM users)
        );
    `);
  }

  async seedDepartment() {
    for (const dept of this.departments) {
      const exists = await this.departmentTable.findOne({
        where: { name: dept.name },
      });

      if (!exists) {
        await this.departmentTable.save(dept);
      }
    }

    await this.departmentTable.query(`
        SELECT setval(
            pg_get_serial_sequence('departments', 'id'),
            (SELECT MAX(id) FROM departments)
        );
    `);
  }

  async seedVacancy() {
    for (const vacancy of this.vacancies) {
      const exists = await this.vacancyTable.findOne({
        where: {
          title: vacancy.title,
          departmentId: vacancy.departmentId,
        },
      });

      if (!exists) {
        await this.vacancyTable.save(vacancy);
      }
    }

    await this.departmentTable.query(`
        SELECT setval(
            pg_get_serial_sequence('departments', 'id'),
            (SELECT MAX(id) FROM departments)
        );
    `);
  }
  async runSeed() {
    await this.seedDepartment();
    await this.seedUser();
    await this.seedVacancy();
  }
}
