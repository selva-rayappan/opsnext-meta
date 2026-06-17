import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserPayload } from '@opsnext/shared';
declare global {
    namespace Express {
        interface User extends UserPayload {
        }
    }
}
export declare class TenantMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void;
}
