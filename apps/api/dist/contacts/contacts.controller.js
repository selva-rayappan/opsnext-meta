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
exports.ContactsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const shared_1 = require("@opsnext/shared");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const contacts_service_1 = require("./contacts.service");
const create_contact_dto_1 = require("./dto/create-contact.dto");
const update_contact_dto_1 = require("./dto/update-contact.dto");
const list_contacts_query_dto_1 = require("./dto/list-contacts-query.dto");
class LinkAccountBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account UUID to link' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LinkAccountBody.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Contact role at this account (e.g. "Decision Maker")' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LinkAccountBody.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mark this as the primary account for the contact' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], LinkAccountBody.prototype, "isPrimary", void 0);
class AddTagBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tag UUID to attach' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddTagBody.prototype, "tagId", void 0);
class MergeBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the contact that will survive the merge' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MergeBody.prototype, "mergeIntoId", void 0);
class BulkImportBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [create_contact_dto_1.CreateContactDto], description: 'Array of contacts to import' }),
    __metadata("design:type", Array)
], BulkImportBody.prototype, "contacts", void 0);
let ContactsController = class ContactsController {
    constructor(contacts) {
        this.contacts = contacts;
    }
    findAll(user, query) {
        return this.contacts.findAll(user.orgId, query);
    }
    findOne(id, user) {
        return this.contacts.findById(id, user.orgId);
    }
    create(dto, user) {
        return this.contacts.create(dto, user.sub, user.orgId);
    }
    bulkImport(dto, user) {
        return this.contacts.bulkImport(dto.contacts, user.sub, user.orgId);
    }
    update(id, dto, user) {
        return this.contacts.update(id, dto, user.sub, user.orgId);
    }
    remove(id, user) {
        return this.contacts.softDelete(id, user.sub, user.orgId);
    }
    merge(id, dto, user) {
        return this.contacts.merge(id, dto.mergeIntoId, user.sub, user.orgId);
    }
    linkAccount(id, dto, user) {
        return this.contacts.linkAccount(id, dto.accountId, user.orgId, dto.title, dto.isPrimary);
    }
    unlinkAccount(id, accountId, user) {
        return this.contacts.unlinkAccount(id, accountId, user.orgId);
    }
    addTag(id, dto, user) {
        return this.contacts.addTag(id, dto.tagId, user.orgId);
    }
    removeTag(id, tagId, user) {
        return this.contacts.removeTag(id, tagId, user.orgId);
    }
};
exports.ContactsController = ContactsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'List contacts (paginated, filterable, sortable)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Paginated contact list' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_contacts_query_dto_1.ListContactsQueryDto]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "GET /contacts/:id", summary: 'Get a contact by ID' }),
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOkResponse)({ description: 'Contact record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Contact not found in this organization' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new contact' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Contact created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_contact_dto_1.CreateContactDto, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk-import contacts; skips duplicates by email' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Import summary with created/skipped/errors counts' }),
    (0, swagger_1.ApiBody)({ type: BulkImportBody }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BulkImportBody, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update a contact' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated contact record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Contact not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_contact_dto_1.UpdateContactDto, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a contact (sets isActive=false)' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Contact deactivated' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Contact not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/merge'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Merge a duplicate contact into another' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Surviving (target) contact after merge' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Source or target contact not found' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MergeBody, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "merge", null);
__decorate([
    (0, common_1.Post)(':id/accounts'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Link a contact to an account' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Link created or updated' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Contact or account not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, LinkAccountBody, Object]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "linkAccount", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "DELETE /contacts/:id/accounts/:accountId", summary: 'Remove a contact–account link' }),
    (0, common_1.Delete)(':id/accounts/:accountId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Link removed' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('accountId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "unlinkAccount", null);
__decorate([
    (0, common_1.Post)(':id/tags'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Attach a tag to a contact' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Tag attached' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Contact or tag not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddTagBody, Object]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "addTag", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "DELETE /contacts/:id/tags/:tagId", summary: 'Remove a tag from a contact' }),
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
], ContactsController.prototype, "removeTag", null);
exports.ContactsController = ContactsController = __decorate([
    (0, swagger_1.ApiTags)('contacts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('contacts'),
    __metadata("design:paramtypes", [contacts_service_1.ContactsService])
], ContactsController);
//# sourceMappingURL=contacts.controller.js.map