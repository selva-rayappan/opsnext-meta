import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@opsnext/shared';

/**
 * Extracts the authenticated user payload from the request.
 * Use with @CurrentUser() in controller method parameters.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: UserPayload }>();
    return request.user;
  },
);
