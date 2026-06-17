import { Role } from '@opsnext/shared';
import { InviteUserDto } from './dto/invite-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';
declare class AcceptInviteBody {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
}
declare class UpdateRoleBody {
    role: Role;
}
declare class ChangePasswordBody {
    currentPassword: string;
    newPassword: string;
}
declare class DeleteConfirmBody {
    confirm: boolean;
}
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    getMe(user: {
        sub: string;
        orgId: string;
    }): Promise<Record<string, unknown>>;
    changePassword(dto: ChangePasswordBody, user: {
        sub: string;
    }): Promise<void>;
    acceptInvite(dto: AcceptInviteBody): Promise<Record<string, unknown>>;
    invite(dto: InviteUserDto, user: {
        sub: string;
        orgId: string;
    }): Promise<void>;
    findAll(user: {
        sub: string;
        orgId: string;
        role: Role;
    }, query: ListUsersQueryDto): Promise<import("./users.service").PaginatedUsers<Record<string, unknown>>>;
    findOne(id: string, user: {
        orgId: string;
    }): Promise<Record<string, unknown>>;
    updateRole(id: string, dto: UpdateRoleBody, user: {
        sub: string;
        orgId: string;
    }): Promise<void>;
    deactivate(id: string, user: {
        sub: string;
        orgId: string;
    }): Promise<void>;
    reactivate(id: string, user: {
        sub: string;
        orgId: string;
    }): Promise<void>;
    delete(id: string, dto: DeleteConfirmBody, user: {
        sub: string;
        orgId: string;
    }): Promise<void>;
}
export {};
