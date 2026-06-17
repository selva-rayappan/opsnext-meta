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
exports.PipelinesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const shared_1 = require("@opsnext/shared");
const pipelines_service_1 = require("./pipelines.service");
const create_pipeline_dto_1 = require("./dto/create-pipeline.dto");
const update_pipeline_dto_1 = require("./dto/update-pipeline.dto");
const create_stage_dto_1 = require("./dto/create-stage.dto");
const update_stage_dto_1 = require("./dto/update-stage.dto");
const reorder_stages_dto_1 = require("./dto/reorder-stages.dto");
let PipelinesController = class PipelinesController {
    constructor(service) {
        this.service = service;
    }
    findAll(user) {
        return this.service.findAll(user.orgId);
    }
    findOne(id, user) {
        return this.service.findById(id, user.orgId);
    }
    create(dto, user) {
        return this.service.create(dto, user.sub, user.orgId);
    }
    update(id, dto, user) {
        return this.service.update(id, dto, user.sub, user.orgId);
    }
    remove(id, user) {
        return this.service.delete(id, user.sub, user.orgId);
    }
    createStage(pipelineId, dto, user) {
        return this.service.createStage(pipelineId, dto, user.sub, user.orgId);
    }
    updateStage(pipelineId, stageId, dto, user) {
        return this.service.updateStage(pipelineId, stageId, dto, user.sub, user.orgId);
    }
    deleteStage(pipelineId, stageId, user) {
        return this.service.deleteStage(pipelineId, stageId, user.sub, user.orgId);
    }
    reorderStages(pipelineId, dto, user) {
        return this.service.reorderStages(pipelineId, dto.stageIds, user.sub, user.orgId);
    }
};
exports.PipelinesController = PipelinesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'List all pipelines with their stages' }),
    (0, swagger_1.ApiOkResponse)({ description: 'List of pipelines' }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get a pipeline by id' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Pipeline record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Pipeline not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new pipeline' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Created pipeline' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pipeline_dto_1.CreatePipelineDto, Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a pipeline' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated pipeline' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Pipeline not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_pipeline_dto_1.UpdatePipelineDto, Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a pipeline' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Pipeline deleted' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Pipeline not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/stages'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new stage in a pipeline' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Created stage' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_stage_dto_1.CreateStageDto, Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "createStage", null);
__decorate([
    (0, common_1.Patch)(':id/stages/:stageId'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a stage in a pipeline' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated stage' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('stageId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_stage_dto_1.UpdateStageDto, Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "updateStage", null);
__decorate([
    (0, common_1.Delete)(':id/stages/:stageId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a stage from a pipeline' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Stage deleted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('stageId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "deleteStage", null);
__decorate([
    (0, common_1.Post)(':id/stages/reorder'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder stages in a pipeline' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Ordered stages list' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_stages_dto_1.ReorderStagesDto, Object]),
    __metadata("design:returntype", void 0)
], PipelinesController.prototype, "reorderStages", null);
exports.PipelinesController = PipelinesController = __decorate([
    (0, swagger_1.ApiTags)('pipelines'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('pipelines'),
    __metadata("design:paramtypes", [pipelines_service_1.PipelinesService])
], PipelinesController);
//# sourceMappingURL=pipelines.controller.js.map