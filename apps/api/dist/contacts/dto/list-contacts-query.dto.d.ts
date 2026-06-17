export declare class ListContactsQueryDto {
    page: number;
    limit: number;
    q?: string;
    isActive?: boolean;
    ownerId?: string;
    tagId?: string;
    sortBy: 'firstName' | 'lastName' | 'email' | 'createdAt';
    order: 'asc' | 'desc';
}
