import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
export type ContactRow = Prisma.ContactGetPayload<{
    include: {
        owner: {
            select: {
                id: true;
                firstName: true;
                lastName: true;
            };
        };
        accountLinks: {
            include: {
                account: {
                    select: {
                        id: true;
                        name: true;
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
export interface PaginatedContacts {
    data: ContactRow[];
    total: number;
    page: number;
    limit: number;
}
export interface BulkImportResult {
    created: number;
    skipped: number;
    errors: Array<{
        index: number;
        reason: string;
    }>;
}
export interface BulkContactInput {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
}
export declare class ContactsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(orgId: string, query: ListContactsQueryDto): Promise<PaginatedContacts>;
    findById(id: string, orgId: string): Promise<ContactRow>;
    create(dto: CreateContactDto, actorId: string, orgId: string): Promise<ContactRow>;
    update(id: string, dto: UpdateContactDto, actorId: string, orgId: string): Promise<ContactRow>;
    softDelete(id: string, actorId: string, orgId: string): Promise<void>;
    merge(sourceId: string, targetId: string, actorId: string, orgId: string): Promise<ContactRow>;
    bulkImport(contacts: BulkContactInput[], actorId: string, orgId: string): Promise<BulkImportResult>;
    linkAccount(contactId: string, accountId: string, orgId: string, title?: string, isPrimary?: boolean): Promise<void>;
    unlinkAccount(contactId: string, accountId: string, orgId: string): Promise<void>;
    addTag(contactId: string, tagId: string, orgId: string): Promise<void>;
    removeTag(contactId: string, tagId: string, orgId: string): Promise<void>;
}
