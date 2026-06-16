import { SetMetadata } from '@nestjs/common';
import { Role } from '@opsnext/shared';

export const ROLES_KEY = 'roles';

/**
 * Declares which roles are allowed to access the decorated route.
 * Evaluated by RolesGuard.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
