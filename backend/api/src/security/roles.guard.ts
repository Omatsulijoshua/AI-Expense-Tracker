import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    const userRole: Role = user.role || user.workspaceRole || Role.MEMBER;

    // OWNER has permission over all actions
    if (userRole === Role.OWNER) {
      return true;
    }

    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient privileges: requires one of [${requiredRoles.join(', ')}] role(s)`,
      );
    }

    return true;
  }
}
