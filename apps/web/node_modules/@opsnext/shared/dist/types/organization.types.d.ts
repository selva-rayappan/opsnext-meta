export declare enum OrganizationStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING_DELETION = "PENDING_DELETION"
}
export interface Organization {
    id: string;
    name: string;
    slug: string;
    status: OrganizationStatus;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=organization.types.d.ts.map