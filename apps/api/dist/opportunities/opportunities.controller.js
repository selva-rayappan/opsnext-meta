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
exports.OpportunitiesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const shared_1 = require("@opsnext/shared");
const opportunities_service_1 = require("./opportunities.service");
const create_opportunity_dto_1 = require("./dto/create-opportunity.dto");
const update_opportunity_dto_1 = require("./dto/update-opportunity.dto");
const list_opportunities_query_dto_1 = require("./dto/list-opportunities-query.dto");
const forecast_query_dto_1 = require("./dto/forecast-query.dto");
const change_stage_dto_1 = require("./dto/change-stage.dto");
const mark_won_dto_1 = require("./dto/mark-won.dto");
const mark_lost_dto_1 = require("./dto/mark-lost.dto");
let OpportunitiesController = class OpportunitiesController {
    constructor(service) {
        this.service = service;
    }
    findAll(query, user) {
        return this.service.findAll(user.orgId, query, user.role, user.sub);
    }
    getForecast(query, user) {
        return this.service.getForecast(user.orgId, query, user.role, user.sub);
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
    changeStage(id, body, user) {
        return this.service.changeStage(id, body.stageId, user.sub, user.orgId);
    }
    markWon(id, dto, user) {
        return this.service.markWon(id, dto, user.sub, user.orgId);
    }
    markLost(id, dto, user) {
        return this.service.markLost(id, dto, user.sub, user.orgId);
    }
    remove(id, user) {
        return this.service.delete(id, user.sub, user.orgId);
    }
};
exports.OpportunitiesController = OpportunitiesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'List opportunities with pagination, filtering, and sorting' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Paginated list of opportunities' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_opportunities_query_dto_1.ListOpportunitiesQueryDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('forecast'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get probability-weighted sales forecast metrics' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Forecast data grouped by month' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forecast_query_dto_1.ForecastQueryDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "getForecast", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a single opportunity' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Opportunity details with history' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Opportunity not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new opportunity' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Created opportunity' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_opportunity_dto_1.CreateOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update an opportunity' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated opportunity' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Opportunity not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_opportunity_dto_1.UpdateOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/stage'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Transition an opportunity to a different stage' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Opportunity record after stage change' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Opportunity or Stage not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_stage_dto_1.ChangeStageDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "changeStage", null);
__decorate([
    (0, common_1.Post)(':id/won'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an opportunity as WON' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Opportunity record after status change' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mark_won_dto_1.MarkWonDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "markWon", null);
__decorate([
    (0, common_1.Post)(':id/lost'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an opportunity as LOST' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Opportunity record after status change' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mark_lost_dto_1.MarkLostDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "markLost", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an opportunity' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Opportunity deleted' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Opportunity not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "remove", null);
exports.OpportunitiesController = OpportunitiesController = __decorate([
    (0, swagger_1.ApiTags)('opportunities'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('opportunities'),
    __metadata("design:paramtypes", [opportunities_service_1.OpportunitiesService])
], OpportunitiesController);
//# sourceMappingURL=opportunities.controller.js.map