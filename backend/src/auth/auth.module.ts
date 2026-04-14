import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Applicant } from 'src/entities/applicant.entity';
import { Employee } from 'src/entities/employee.entity';
import { ActivityLog } from 'src/entities/activity-log.entity';
import { LoginHistory } from 'src/entities/login-history.entity';
import { UserAccount } from 'src/entities/user-account.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'change-me-in-env'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') as never,
        },
      }),
    }),
    TypeOrmModule.forFeature([
      UserAccount,
      Employee,
      Applicant,
      LoginHistory,
      ActivityLog,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
