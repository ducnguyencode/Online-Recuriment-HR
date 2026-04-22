import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { canonicalizeRoles } from './role.constants';
import { userRoleEnumToAuthRoles } from './user-role.mapper';

export type JwtPayload = { sub: number; roles?: string[] };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findOne({
      where: { id: payload.sub, isActive: true },
      relations: ['applicant', 'employee', 'employee.department'],
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const raw = user.roles?.trim();
    const roles = canonicalizeRoles(
      raw ? raw : userRoleEnumToAuthRoles(user.role),
    );
    return {
      userId: user.id,
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      roles,
      applicantId: user.applicant?.id ?? null,
      departmentId: user.employee?.department?.id ?? null,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
