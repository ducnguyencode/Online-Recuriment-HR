import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { VacancyPolicyGuard } from '../guards/vacancy-policy.guard';
import { UserRole } from '../enum';
import { Roles } from './decorator';

export interface VacancyAccessOptions {
  roles?: UserRole[];
  ownershipField?: string;
  blockedStatuses?: string[];
}

export const VACANCY_ACCESS_KEY = 'vacancy_access';

export function VacancyAccess(options: VacancyAccessOptions = {}) {
  return applyDecorators(
    SetMetadata(VACANCY_ACCESS_KEY, {
      roles: [UserRole.SUPER_ADMIN, UserRole.HR],
      ownershipField: 'createdById',
      blockedStatuses: [],
      ...options,
    }),
    UseGuards(JwtAuthGuard, RolesGuard, VacancyPolicyGuard),
    Roles(...(options.roles ?? [])),
  );
}
