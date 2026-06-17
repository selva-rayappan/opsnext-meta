import { Role } from '@opsnext/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ConfigService } from '@nestjs/config';
export interface PaginatedUsers<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
export declare class UsersService {
    private readonly tenantPrisma;
    private readonly prisma;
    private readonly audit;
    private readonly mail;
    private readonly config;
    constructor(tenantPrisma: TenantPrismaService, prisma: PrismaService, audit: AuditService, mail: MailService, config: ConfigService);
    findAll(orgId: string, query: ListUsersQueryDto): Promise<PaginatedUsers<Record<string, unknown>>>;
    findById(userId: string, orgId: string): Promise<Record<string, unknown>>;
    findByEmail(email: string): Promise<Record<string, unknown> | null>;
    invite(orgId: string, dto: InviteUserDto, invitedById: string): Promise<void>;
    acceptInvite(token: string, firstName: string, lastName: string, password: string): Promise<Record<string, unknown>>;
    deactivate(userId: string, actorId: string, orgId: string): Promise<void>;
    reactivate(userId: string, actorId: string, orgId: string): Promise<void>;
    updateRole(userId: string, newRole: Role, actorId: string, orgId: string): Promise<void>;
    delete(userId: string, actorId: string, orgId: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    private requireUserInOrg;
}
