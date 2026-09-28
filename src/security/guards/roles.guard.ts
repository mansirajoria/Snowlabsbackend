import { LevelPermission } from '@access/level/entites/level-permission.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@utils/enum';
import HttpException from '@utils/exceptions/HttpException';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthEntity = request.user;

    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // console.log(user.role);
    // console.log(roles);

    //if (!roles.includes('Student')) return false; //later will see

    // Admin Role Check
    if (user.role == RoleType.ADMIN) return true;

    // Student Role Check
    // if (user.role == RoleType.STUDENT) return true;
    if (user.role == RoleType.STUDENT && !roles.includes(RoleType.STUDENT))
      throw new HttpException(
        HttpStatus.FORBIDDEN,
        'You do not have permission to access this resource.',
      );

    // UnProtected Route
    if (!roles) return true;

    if (roles) {
      // when user role is not Admin & try to acces restricted route : Important Check
      if (!roles.includes(user.role)) return false;
    }

    // Required Permissions
    const requiredPermissions: any = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );
    // console.log('REQUIRED -->', requiredPermissions);

    // Access Check : READ and WRITE
    const requiredAccess = this.reflector.getAllAndOverride<string[]>(
      'access',
      [context.getHandler(), context.getClass()],
    );

    // console.log('requiredAccess ->', requiredAccess);

    // User Permissions
    const userPermissions = [];
    if (user.role == RoleType.SUB_ADMIN) {
      user.subAdmin.level.levelPermission.forEach((i: LevelPermission) => {
        userPermissions.push({
          name: i.module.name,
          read: i.read,
          write: i.write,
        });
        // userPermissions.push(i.module.name);
      });
    }
    // console.log('USER Permissions-->', userPermissions);

    let isValidPermission = true;
    requiredPermissions.forEach((el: string) => {
      userPermissions.forEach((i: any) => {
        if (el == i.name) {
          if (
            (requiredAccess.includes('Read') && !i.read) ||
            (requiredAccess.includes('Write') && !i.write)
          ) {
            isValidPermission = false;
          }
        }
      });
    });
    // console.log(isValidPermission);

    // ROLE CHECK HERE
    let isValidRole = false;

    if (user && user?.role) {
      roles.forEach((role) => {
        if (role == user.role) isValidRole = true;
      });
    }

    if (!isValidPermission || !isValidRole) {
      // Customize the forbidden message here.
      throw new HttpException(
        HttpStatus.FORBIDDEN,
        'You do not have permission to access this resource.',
      );
    }

    return isValidRole && isValidPermission;
  }
}
