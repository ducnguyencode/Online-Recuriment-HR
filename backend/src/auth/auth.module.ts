import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Applicant } from '../entities/applicant.entity';
import { SignupVerification } from '../entities/signup-verification.entity';
import { User } from '../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { BrevoApiService } from '../services/brevo-api.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { SignupCleanupService } from './signup-cleanup.service';
import { AuthService as LegacyAuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { MailService } from '../services/mail.service';

@Module({
  imports: [
    MailerModule,
    TypeOrmModule.forFeature([User, Applicant, SignupVerification]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-change-me',
        signOptions: {
          expiresIn: Number(config.get('JWT_EXPIRES_SEC') ?? 604800),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    BrevoApiService,
    SignupCleanupService,
    LegacyAuthService,
    UserService,
    MailService,
  ],
  exports: [AuthService, JwtModule, PassportModule, UserService, MailService],
})
export class AuthModule {}
