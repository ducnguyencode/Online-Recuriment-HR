/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectRepository(User) private userTable: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || ' secret',
    });
  }

  async validate(payload: any) {
    if (Number.isNaN(payload.sub)) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.userTable.findOne({
      where: { id: payload.sub, email: payload.email },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        employee: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
