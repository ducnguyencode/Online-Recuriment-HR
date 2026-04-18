/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enum';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user,
);

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

export const OwnershipField = (field: string) =>
  SetMetadata('ownershipField', field);

export const NotProceedOnStatus = (...status: string[]) =>
  SetMetadata('notProceedOnStatus', status);
