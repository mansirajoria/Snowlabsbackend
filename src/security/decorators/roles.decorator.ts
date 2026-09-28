import { SetMetadata } from '@nestjs/common';
import { PermissionType, RoleType, AccessType } from '@utils/enum';

export const Roles = (...roles: RoleType[]): any => SetMetadata('roles', roles);

export const CheckPermissions = (...permissions: PermissionType[]): any =>
  SetMetadata('permissions', permissions);

export const CheckAccess = (...access: AccessType[]): any =>
  SetMetadata('access', access);
