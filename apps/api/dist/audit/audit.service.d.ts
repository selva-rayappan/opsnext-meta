import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@opsnext/shared';
export interface AuditLogParams {
    organizationId: string;
    actorId?: string;
    actorRole?: Role;
    action: string;
    entityType: string;
    entityId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(params: AuditLogParams): Promise<void>;
}
