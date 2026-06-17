export declare enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    SALES_MANAGER = "SALES_MANAGER",
    SALES_REP = "SALES_REP",
    READ_ONLY = "READ_ONLY"
}
export interface UserPayload {
    sub: string;
    orgId: string;
    role: Role;
    email: string;
}
