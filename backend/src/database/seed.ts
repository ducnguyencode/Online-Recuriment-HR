/* eslint-disable @typescript-eslint/no-misused-promises */
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/common/enum';
import { Department } from 'src/entities/department.entity';
import { Repository } from 'typeorm';
import * as bycrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';

export class Seed {
  constructor(
    @InjectRepository(Department)
    private departmentTable: Repository<Department>,
    @InjectRepository(User)
    private userTable: Repository<User>,
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

  async runSeed() {
    await this.seedDepartment();
    await this.seedUser();
  }
}
