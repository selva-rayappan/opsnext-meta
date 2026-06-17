import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, UserPayload } from '@opsnext/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * RolesGuard — fail-closed RBAC guard.
 *
 * Rules:
 *  1. Routes without @Roles() are DENIED (fail-closed). Use @Public() to open a route
 *     entirely, or @Roles(Role.READ_ONLY) to allow any authenticated user.
 *  2. SUPER_ADMIN is allowed on all routes unless the route is marked @Public()
 *     (in which case JwtAuthGuard already short-circuits and this guard never runs).
 *  3. Role check is exact membership — a role must be explicitly listed.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Public() routes bypass role checks entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → DENY (fail-closed)
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException(
        'Access denied: this route requires explicit role authorization.',
      );
    }

    const request = context.switchToHttp().getRequest<{ user?: UserPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user found');
    }

    // SUPER_ADMIN bypasses all role checks
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    const allowed = requiredRoles.includes(user.role);

    if (!allowed) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(' or ')}, got: ${user.role}`,
      );
    }

    return true;
  }
}
