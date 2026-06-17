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
exports.CustomFieldsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const shared_1 = require("@opsnext/shared");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const custom_fields_service_1 = require("./custom-fields.service");
const create_custom_field_dto_1 = require("./dto/create-custom-field.dto");
const update_custom_field_dto_1 = require("./dto/update-custom-field.dto");
class ListCustomFieldsQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES),
    __metadata("design:type", String)
], ListCustomFieldsQueryDto.prototype, "entityType", void 0);
let CustomFieldsController = class CustomFieldsController {
    constructor(customFields) {
        this.customFields = customFields;
    }
    findAll(user, query) {
        return this.customFields.findAll(user.orgId, query.entityType);
    }
    create(dto, user) {
        return this.customFields.create(dto, user.orgId);
    }
    update(id, dto, user) {
        return this.customFields.update(id, dto, user.orgId);
    }
    remove(id, user) {
        return this.customFields.delete(id, user.orgId);
    }
};
exports.CustomFieldsController = CustomFieldsController;
__decorate([
    (0, swagger_1.ApiOperation)({ description: "GET /custom-fields?entityType=Contact\nReturns field definitions, optionally filtered by entity type.", summary: 'List custom field definitions (optionally filter by entityType)' }),
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOkResponse)({ description: 'Array of custom field definitions' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ListCustomFieldsQueryDto]),
    __metadata("design:returntype", void 0)
], CustomFieldsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "POST /custom-fields", summary: 'Create a new custom field definition' }),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Custom field created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_custom_field_dto_1.CreateCustomFieldDto, Object]),
    __metadata("design:returntype", void 0)
], CustomFieldsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "PATCH /custom-fields/:id", summary: 'Update a custom field definition (entityType cannot be changed)' }),
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated custom field' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Custom field not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_custom_field_dto_1.UpdateCustomFieldDto, Object]),
    __metadata("design:returntype", void 0)
], CustomFieldsController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "DELETE /custom-fields/:id\nRemoves the field definition and all stored values (DB cascade).", summary: 'Delete a custom field and all its stored values' }),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Custom field deleted' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Custom field not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomFieldsController.prototype, "remove", null);
exports.CustomFieldsController = CustomFieldsController = __decorate([
    (0, swagger_1.ApiTags)('custom-fields'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('custom-fields'),
    __metadata("design:paramtypes", [custom_fields_service_1.CustomFieldsService])
], CustomFieldsController);
//# sourceMappingURL=custom-fields.controller.js.map