import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserPayload } from '@opsnext/shared';
import { TenantContext } from '../../prisma/tenant-prisma.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Merges UserPayload into Express.User so req.user carries our JWT fields
    interface User extends UserPayload {}
  }
}

/**
 * TenantMiddleware — runs after Passport JWT strategy has populated req.user.
 *
 * Extracts `orgId` from the validated JWT payload and stores it in the
 * TenantContext AsyncLocalStorage so that TenantPrismaService can inject it
 * into every Prisma query without it being threaded manually through every
 * service call.
 *
 * If req.user is absent (unauthenticated / public route), the middleware
 * simply calls next() without setting context. TenantPrismaService will
 * throw ForbiddenException if a query is attempted without context and
 * skipTenantFilter is not set.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const orgId = req.user?.orgId;

    if (orgId) {
      // Run the rest of the request pipeline inside the tenant context store
      TenantContext.run({ organizationId: orgId }, next);
    } else {
      next();
    }
  }
}
