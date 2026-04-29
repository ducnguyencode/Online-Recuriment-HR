import { APPLICATION_STATUS_ACCESS_KEY } from './../decorator/application-status-access.decorator';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, UserRole } from '../enum';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from 'src/entities/application.entity';
import { Repository } from 'typeorm';
import { ApplicationStatusAccessOptions } from '../decorator/application-status-access.decorator';

const APPLICATION_STATUS_TRANSITIONS_BY_ROLE: Partial<
  Record<UserRole, Partial<Record<ApplicationStatus, ApplicationStatus[]>>>
> = {
  [UserRole.SUPER_ADMIN]: {},

  [UserRole.HR]: {
    [ApplicationStatus.PENDING]: [
      ApplicationStatus.INTERVIEW_SCHEDULED,
      ApplicationStatus.NOT_REQUIRED,
    ],
    [ApplicationStatus.INTERVIEW_SCHEDULED]: [
      ApplicationStatus.SELECTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.NOT_REQUIRED,
    ],
  },

  [UserRole.INTERVIEWER]: {
    [ApplicationStatus.INTERVIEW_SCHEDULED]: [
      ApplicationStatus.SELECTED,
      ApplicationStatus.REJECTED,
    ],
  },
};

@Injectable()
export class ApplicationStatusPolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Application)
    private readonly applicationTable: Repository<Application>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const id = Number(request.query.id);
    const nextStatus = request.query.status as ApplicationStatus;

    const config =
      this.reflector.getAllAndOverride<ApplicationStatusAccessOptions>(
        APPLICATION_STATUS_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      ) || {};

    const { allowSameStatus = false } = config;

    //Super Admin
    if (user.role == UserRole.SUPER_ADMIN) {
      return true;
    }

    const entity = await this.applicationTable.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Application not found');
    }

    const currentStatus = entity.status as ApplicationStatus;

    if (!allowSameStatus && currentStatus === nextStatus) {
      throw new BadRequestException(
        `Application already in status ${currentStatus}`,
      );
    }

    const roleTransitions =
      APPLICATION_STATUS_TRANSITIONS_BY_ROLE[user.role] || {};

    const allowedNext = roleTransitions[currentStatus] || [];

    //Check invalid transition
    if (!allowedNext.includes(nextStatus)) {
      throw new ForbiddenException(
        `Role ${user.role} cannot change ${currentStatus} -> ${nextStatus}`,
      );
    }

    request.application = entity;
    return true;
  }
}
