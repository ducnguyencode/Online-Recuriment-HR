/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/common/enum';
import { Repository } from 'typeorm';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly repo: Repository<any>,
    private message: string,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const id = Number(request.params.id);

    const ownershipField =
      this.reflector.get<string>('ownershipField', context.getHandler()) ||
      'createdBy';

    if (user.role == UserRole.SUPER_ADMIN) {
      return true;
    }

    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Resource not found');
    }

    if (entity[ownershipField] !== user.id) {
      throw new ForbiddenException(
        this.message || 'You can only access your own resource',
      );
    }

    return true;
  }
}
