import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto';
export type AccountRow = Prisma.AccountGetPayload<{
    include: {
        owner: {
            select: {
                id: true;
                firstName: true;
                lastName: true;
            };
        };
        contactLinks: {
            include: {
                contact: {
                    select: {
                        id: true;
                        firstName: true;
                        lastName: true;
                        email: true;
                    };
                };
            };
        };
        tags: {
            include: {
                tag: {
                    select: {
                        id: true;
                        name: true;
                        color: true;
                    };
                };
            };
        };
    };
}>;
export interface PaginatedAccounts {
    data: AccountRow[];
    total: number;
    page: number;
    limit: number;
}
export declare class AccountsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(orgId: string, query: ListAccountsQueryDto): Promise<PaginatedAccounts>;
    findById(id: string, orgId: string): Promise<AccountRow>;
    create(dto: CreateAccountDto, actorId: string, orgId: string): Promise<AccountRow>;
    update(id: string, dto: UpdateAccountDto, actorId: string, orgId: string): Promise<AccountRow>;
    softDelete(id: string, actorId: string, orgId: string): Promise<void>;
    addTag(accountId: string, tagId: string, orgId: string): Promise<void>;
    removeTag(accountId: string, tagId: string, orgId: string): Promise<void>;
}
