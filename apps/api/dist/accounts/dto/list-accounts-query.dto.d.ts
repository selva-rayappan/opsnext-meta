export declare class ListAccountsQueryDto {
    page: number;
    limit: number;
    q?: string;
    isActive?: boolean;
    ownerId?: string;
    sortBy: 'name' | 'domain' | 'createdAt';
    order: 'asc' | 'desc';
}
