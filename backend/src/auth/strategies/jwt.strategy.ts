import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../interfaces/auth-user.interface';
import { UserRole } from 'src/enum/user-role.enum';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  employeeId: string | null;
  applicantId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'change-me-in-env'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      accountId: payload.sub,
      email: payload.email,
      role: payload.role,
      employeeId: payload.employeeId,
      applicantId: payload.applicantId,
    };
  }
}
