import { Role } from '@opsnext/shared';
export declare class ListUsersQueryDto {
    page: number;
    limit: number;
    isActive?: boolean;
    role?: Role;
    sortBy: 'createdAt' | 'lastName' | 'lastLoginAt';
    order: 'asc' | 'desc';
}
