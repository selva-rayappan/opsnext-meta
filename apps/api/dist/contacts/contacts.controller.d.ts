import { UserPayload } from '@opsnext/shared';
import { ContactsService, BulkContactInput } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
declare class LinkAccountBody {
    accountId: string;
    title?: string;
    isPrimary?: boolean;
}
declare class AddTagBody {
    tagId: string;
}
declare class MergeBody {
    mergeIntoId: string;
}
declare class BulkImportBody {
    contacts: BulkContactInput[];
}
export declare class ContactsController {
    private readonly contacts;
    constructor(contacts: ContactsService);
    findAll(user: UserPayload, query: ListContactsQueryDto): Promise<import("./contacts.service").PaginatedContacts>;
    findOne(id: string, user: UserPayload): Promise<{
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string;
            };
        } & {
            contactId: string;
            tagId: string;
        })[];
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        accountLinks: ({
            account: {
                id: string;
                name: string;
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
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        firstName: string;
        lastName: string;
        isActive: boolean;
        phone: string | null;
        title: string | null;
        source: string | null;
        ownerId: string | null;
        mergedIntoId: string | null;
        notes: string | null;
    }>;
    create(dto: CreateContactDto, user: UserPayload): Promise<{
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string;
            };
        } & {
            contactId: string;
            tagId: string;
        })[];
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        accountLinks: ({
            account: {
                id: string;
                name: string;
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
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        firstName: string;
        lastName: string;
        isActive: boolean;
        phone: string | null;
        title: string | null;
        source: string | null;
        ownerId: string | null;
        mergedIntoId: string | null;
        notes: string | null;
    }>;
    bulkImport(dto: BulkImportBody, user: UserPayload): Promise<import("./contacts.service").BulkImportResult>;
    update(id: string, dto: UpdateContactDto, user: UserPayload): Promise<{
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string;
            };
        } & {
            contactId: string;
            tagId: string;
        })[];
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        accountLinks: ({
            account: {
                id: string;
                name: string;
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
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        firstName: string;
        lastName: string;
        isActive: boolean;
        phone: string | null;
        title: string | null;
        source: string | null;
        ownerId: string | null;
        mergedIntoId: string | null;
        notes: string | null;
    }>;
    remove(id: string, user: UserPayload): Promise<void>;
    merge(id: string, dto: MergeBody, user: UserPayload): Promise<{
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string;
            };
        } & {
            contactId: string;
            tagId: string;
        })[];
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        accountLinks: ({
            account: {
                id: string;
                name: string;
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
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        firstName: string;
        lastName: string;
        isActive: boolean;
        phone: string | null;
        title: string | null;
        source: string | null;
        ownerId: string | null;
        mergedIntoId: string | null;
        notes: string | null;
    }>;
    linkAccount(id: string, dto: LinkAccountBody, user: UserPayload): Promise<void>;
    unlinkAccount(id: string, accountId: string, user: UserPayload): Promise<void>;
    addTag(id: string, dto: AddTagBody, user: UserPayload): Promise<void>;
    removeTag(id: string, tagId: string, user: UserPayload): Promise<void>;
}
export {};
