import { UserPayload } from '@opsnext/shared';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto';
declare class AddTagBody {
    tagId: string;
}
export declare class AccountsController {
    private readonly accounts;
    constructor(accounts: AccountsService);
    findAll(user: UserPayload, query: ListAccountsQueryDto): Promise<import("./accounts.service").PaginatedAccounts>;
    findOne(id: string, user: UserPayload): Promise<{
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string;
            };
        } & {
            accountId: string;
            tagId: string;
        })[];
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        contactLinks: ({
            contact: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string | null;
            contactId: string;
            accountId: string;
            isPrimary: boolean;
        })[];
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        phone: string | null;
        ownerId: string | null;
        notes: string | null;
        domain: string | null;
        industry: string | null;
        employeeCount: number | null;
        website: string | null;
        billingAddress: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(dto: CreateAccountDto, user: UserPayload): Promise<{
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string;
            };
        } & {
            accountId: string;
            tagId: string;
        })[];
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        contactLinks: ({
            contact: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string | null;
            contactId: string;
            accountId: string;
            isPrimary: boolean;
        })[];
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        phone: string | null;
        ownerId: string | null;
        notes: string | null;
        domain: string | null;
        industry: string | null;
        employeeCount: number | null;
        website: string | null;
        billingAddress: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, dto: UpdateAccountDto, user: UserPayload): Promise<{
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string;
            };
        } & {
            accountId: string;
            tagId: string;
        })[];
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        contactLinks: ({
            contact: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string | null;
            contactId: string;
            accountId: string;
            isPrimary: boolean;
        })[];
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        phone: string | null;
        ownerId: string | null;
        notes: string | null;
        domain: string | null;
        industry: string | null;
        employeeCount: number | null;
        website: string | null;
        billingAddress: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string, user: UserPayload): Promise<void>;
    addTag(id: string, dto: AddTagBody, user: UserPayload): Promise<void>;
    removeTag(id: string, tagId: string, user: UserPayload): Promise<void>;
}
export {};
