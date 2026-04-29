/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/common/enum';
import { Repository } from 'typeorm';

@Injectable()
export class StatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly repo: Repository<any>,
    private message: string,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const id = Number(request.params.id);

    const notProceedOnStatus = this.reflector.getAllAndOverride<string[]>(
      'notProceedOnStatuses',
      [context.getHandler(), context.getClass()],
    ) || ['Deleted'];

    if (user.role == UserRole.SUPER_ADMIN) {
      return true;
    }

    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Resource not found');
    }

    if (notProceedOnStatus.includes(entity.status)) {
      throw new PreconditionFailedException(
        this.message || `Can't proceed with status ${entity.status}`,
      );
    }

    request.entity = entity;
    return true;
  }
}
