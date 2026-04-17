import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

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
}
