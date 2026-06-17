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
exports.TagsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@opsnext/shared");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tags_service_1 = require("./tags.service");
const create_tag_dto_1 = require("./dto/create-tag.dto");
const update_tag_dto_1 = require("./dto/update-tag.dto");
let TagsController = class TagsController {
    constructor(tags) {
        this.tags = tags;
    }
    findAll(user) {
        return this.tags.findAll(user.orgId);
    }
    create(dto, user) {
        return this.tags.create(dto, user.orgId, user.sub);
    }
    update(id, dto, user) {
        return this.tags.update(id, dto, user.orgId, user.sub);
    }
    remove(id, user) {
        return this.tags.delete(id, user.orgId, user.sub);
    }
};
exports.TagsController = TagsController;
__decorate([
    (0, swagger_1.ApiOperation)({ description: "GET /tags\nReturns all tags for the caller's organization.", summary: 'List all tags in the organization' }),
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER, shared_1.Role.SALES_REP, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOkResponse)({ description: 'Array of tag records' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TagsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "POST /tags", summary: 'Create a new tag' }),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Tag created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tag_dto_1.CreateTagDto, Object]),
    __metadata("design:returntype", void 0)
], TagsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "PATCH /tags/:id", summary: 'Update a tag name or color' }),
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated tag record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Tag not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tag_dto_1.UpdateTagDto, Object]),
    __metadata("design:returntype", void 0)
], TagsController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "DELETE /tags/:id\nRemoves the tag and all ContactTag/AccountTag associations (via DB cascade).", summary: 'Delete a tag (removes all associations)' }),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SALES_MANAGER),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Tag deleted' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Tag not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TagsController.prototype, "remove", null);
exports.TagsController = TagsController = __decorate([
    (0, swagger_1.ApiTags)('tags'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tags'),
    __metadata("design:paramtypes", [tags_service_1.TagsService])
], TagsController);
//# sourceMappingURL=tags.controller.js.map