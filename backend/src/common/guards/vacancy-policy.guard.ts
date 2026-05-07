/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../enum';
import {
  VACANCY_ACCESS_KEY,
  VacancyAccessOptions,
} from '../decorator/vacancy-access.decorator';

@Injectable()
export class VacancyPolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Vacancy)
    private readonly repo: Repository<Vacancy>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const id = Number(request.params.id);

    const config =
      this.reflector.getAllAndOverride<VacancyAccessOptions>(
        VACANCY_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      ) || {};

    const { ownershipField = 'createdById', blockedStatuses = [] } = config;

    // SUPER_ADMIN bypass
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Resource not found');
    }

    // Ownership check
    if (entity[ownershipField] !== user.id) {
      throw new ForbiddenException('You not own this vacancy');
    }

    // Status check
    if (blockedStatuses.includes(entity.status)) {
      throw new PreconditionFailedException(
        `Cannot proceed with status ${entity.status}`,
      );
    }

    // attach to request → avoid re-query
    request.entity = entity;

    return true;
  }
}
