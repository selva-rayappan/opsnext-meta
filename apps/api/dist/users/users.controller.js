"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const shared_1 = require("@opsnext/shared");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const invite_user_dto_1 = require("./dto/invite-user.dto");
const list_users_query_dto_1 = require("./dto/list-users-query.dto");
const users_service_1 = require("./users.service");
class AcceptInviteBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'abc123hex...', description: 'Invite token from the email link' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AcceptInviteBody.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Jane' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], AcceptInviteBody.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], AcceptInviteBody.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P@ssw0rd!', minLength: 8 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(128),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
        message: 'Password too weak',
    }),
    __metadata("design:type", String)
], AcceptInviteBody.prototype, "password", void 0);
class UpdateRoleBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: shared_1.Role, description: 'New role to assign' }),
    (0, class_validator_1.IsEnum)(shared_1.Role),
    __metadata("design:type", String)
], UpdateRoleBody.prototype, "role", void 0);
class ChangePasswordBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current (existing) password' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangePasswordBody.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New password', minLength: 8 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(128),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
        message: 'Password too weak',
    }),
    __metadata("design:type", String)
], ChangePasswordBody.prototype, "newPassword", void 0);
class DeleteConfirmBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Must be true to confirm permanent, irreversible deletion',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeleteConfirmBody.prototype, "confirm", void 0);
let UsersController = class UsersController {
    constructor(users) {
        this.users = users;
    }
    getMe(user) {
        return this.users.findById(user.sub, user.orgId);
    }
    changePassword(dto, user) {
        return this.users.changePassword(user.sub, dto.currentPassword, dto.newPassword);
    }
    acceptInvite(dto) {
        return this.users.acceptInvite(dto.token, dto.firstName, dto.lastName, dto.password);
    }
    invite(dto, user) {
        return this.users.invite(user.orgId, dto, user.sub);
    }
    findAll(user, query) {
        if (user.role === shared_1.Role.SALES_MANAGER && query.role === undefined) {
            query.role = shared_1.Role.SALES_REP;
        }
        return this.users.findAll(user.orgId, query);
    }
    findOne(id, user) {
        return this.users.findById(id, user.orgId);
    }
    updateRole(id, dto, user) {
        return this.users.updateRole(id, dto.role, user.sub, user.orgId);
    }
    deactivate(id, user) {
        return this.users.deactivate(id, user.sub, user.orgId);
    }
    reactivate(id, user) {
        return this.users.reactivate(id, user.sub, user.orgId);
    }
    async delete(id, dto, user) {
        if (!dto.confirm) {
            throw new common_1.BadRequestException('You must send { "confirm": true } to permanently delete a user');
        }
        return this.users.delete(id, user.sub, user.orgId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(shared_1.Role.READ_ONLY, shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get the currently authenticated user profile' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Own user profile' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "PATCH /users/me/password\nMust be declared BEFORE PATCH /users/:id/... routes.", summary: 'Change own password' }),
    (0, common_1.Patch)('me/password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.READ_ONLY, shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Password changed; all active sessions revoked' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Current password incorrect or validation failed' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChangePasswordBody, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('invite/accept'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Accept an invitation and set up your account' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Account created successfully' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid, expired, or already-used token' }),
    (0, swagger_1.ApiConflictResponse)({ description: 'A user with this email already exists' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AcceptInviteBody]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a new user to the organization' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Invitation email sent' }),
    (0, swagger_1.ApiConflictResponse)({ description: 'User or pending invitation already exists for this email' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Cannot invite SUPER_ADMIN or insufficient permissions' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invite_user_dto_1.InviteUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "invite", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'List users in the organization (paginated, filtered, sorted)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Paginated list of users' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_users_query_dto_1.ListUsersQueryDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "GET /users/:id", summary: 'Get a user by ID' }),
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiOkResponse)({ description: 'User record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'User not found in this organization' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Update a user's role" }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Role updated' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Cannot promote above own role or change own role' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'User not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateRoleBody, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a user (soft delete — sets isActive=false)' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'User deactivated and all sessions revoked' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'User is already deactivated' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'User not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deactivate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "PATCH /users/:id/reactivate", summary: 'Reactivate a previously deactivated user' }),
    (0, common_1.Patch)(':id/reactivate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN),
    (0, swagger_1.ApiNoContentResponse)({ description: 'User reactivated' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'User is already active' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'User not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "reactivate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete a user (irreversible — requires confirm:true)' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'User permanently deleted' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'confirm flag not set to true' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Cannot delete your own account' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'User not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DeleteConfirmBody, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map