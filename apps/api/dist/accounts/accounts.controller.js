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
exports.AccountsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const shared_1 = require("@opsnext/shared");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const accounts_service_1 = require("./accounts.service");
const create_account_dto_1 = require("./dto/create-account.dto");
const update_account_dto_1 = require("./dto/update-account.dto");
const list_accounts_query_dto_1 = require("./dto/list-accounts-query.dto");
class AddTagBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tag UUID to attach' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddTagBody.prototype, "tagId", void 0);
let AccountsController = class AccountsController {
    constructor(accounts) {
        this.accounts = accounts;
    }
    findAll(user, query) {
        return this.accounts.findAll(user.orgId, query);
    }
    findOne(id, user) {
        return this.accounts.findById(id, user.orgId);
    }
    create(dto, user) {
        return this.accounts.create(dto, user.sub, user.orgId);
    }
    update(id, dto, user) {
        return this.accounts.update(id, dto, user.sub, user.orgId);
    }
    remove(id, user) {
        return this.accounts.softDelete(id, user.sub, user.orgId);
    }
    addTag(id, dto, user) {
        return this.accounts.addTag(id, dto.tagId, user.orgId);
    }
    removeTag(id, tagId, user) {
        return this.accounts.removeTag(id, tagId, user.orgId);
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'List accounts (paginated, filterable, sortable)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Paginated account list' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_accounts_query_dto_1.ListAccountsQueryDto]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "GET /accounts/:id\nIncludes contact links with contact names.", summary: 'Get an account by ID (includes linked contacts)' }),
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOkResponse)({ description: 'Account record with contact links' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Account not found in this organization' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new account' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Account created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_account_dto_1.CreateAccountDto, Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update an account' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated account record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Account not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_account_dto_1.UpdateAccountDto, Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete an account (sets isActive=false)' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Account deactivated' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Account not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/tags'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Attach a tag to an account' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Tag attached' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Account or tag not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddTagBody, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "addTag", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "DELETE /accounts/:id/tags/:tagId", summary: 'Remove a tag from an account' }),
    (0, common_1.Delete)(':id/tags/:tagId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Tag removed' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('tagId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "removeTag", null);
exports.AccountsController = AccountsController = __decorate([
    (0, swagger_1.ApiTags)('accounts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('accounts'),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map