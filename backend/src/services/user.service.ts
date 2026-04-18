import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bycrypt from 'bcrypt';
import { UserRole } from 'src/common/enum';
@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userTable: Repository<User>) {}

  create(user: Partial<User>) {
    return this.userTable.save(user);
  }

  findByEmail(email: string) {
    return this.userTable.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.userTable.findOne({ where: { id } });
  }

  //auto create admin if don have
  async ensureDefaultAdmin() {
    const adminEmail = 'admin@gmail.com';
    const existing = await this.findByEmail(adminEmail);

    if (existing) {
      return existing;
    }

    const admin = this.userTable.create({
      fullName: 'Super Admin',
      email: adminEmail,
      password: bycrypt.hashSync('123456', 10),
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      verifiedAt: new Date(),
    });

    return this.userTable.save(admin);
  }
}
