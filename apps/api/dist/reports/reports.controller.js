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
exports.ReportsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const shared_1 = require("@opsnext/shared");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(service) {
        this.service = service;
    }
    getPipelineSummary(user) {
        return this.service.getPipelineSummary(user.orgId, user.role, user.sub);
    }
    getActivityByRep(user) {
        return this.service.getActivityByRep(user.orgId, user.role, user.sub);
    }
    getLeadFunnel(user) {
        return this.service.getLeadFunnel(user.orgId, user.role, user.sub);
    }
    getWinLossAnalysis(user) {
        return this.service.getWinLossAnalysis(user.orgId, user.role, user.sub);
    }
    getRevenueForecast(user) {
        return this.service.getRevenueForecast(user.orgId, user.role, user.sub);
    }
    async export(type, user, res) {
        const csv = await this.service.exportCsv(type, user.orgId, user.role, user.sub);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
        return res.status(200).send(csv);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('pipeline-summary'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get pipeline value distribution by stages' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Pipeline summary data' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPipelineSummary", null);
__decorate([
    (0, common_1.Get)('activity-by-rep'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get rep activity performance' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Activity by rep logs' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getActivityByRep", null);
__decorate([
    (0, common_1.Get)('lead-funnel'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get lead status and conversion rates funnel' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Lead funnel data' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getLeadFunnel", null);
__decorate([
    (0, common_1.Get)('win-loss'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get opportunity win/loss counts and ratios' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Win/loss ratio stats' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getWinLossAnalysis", null);
__decorate([
    (0, common_1.Get)('revenue-forecast'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue forecasting totals' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Forecast revenue grouped by months' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getRevenueForecast", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Export a CSV file for a report type' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "export", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map