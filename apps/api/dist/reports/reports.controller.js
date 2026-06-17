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
const bull_1 = require("@nestjs/bull");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const shared_1 = require("@opsnext/shared");
const reports_service_1 = require("./reports.service");
const create_saved_report_dto_1 = require("./dto/create-saved-report.dto");
let ReportsController = class ReportsController {
    constructor(service, reportsQueue) {
        this.service = service;
        this.reportsQueue = reportsQueue;
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
    getSavedReports(user) {
        return this.service.getSavedReports(user.orgId, user.sub);
    }
    createSavedReport(dto, user) {
        return this.service.createSavedReport(dto, user.sub, user.orgId);
    }
    async deleteSavedReport(id, user) {
        await this.service.deleteSavedReport(id, user.sub, user.orgId, user.role);
    }
    async queueExport(body, user) {
        const job = await this.reportsQueue.add('export-csv', {
            type: body.type,
            orgId: user.orgId,
            role: user.role,
            userId: user.sub,
        });
        return { jobId: job.id };
    }
    async getExportStatus(jobId) {
        const job = await this.reportsQueue.getJob(jobId);
        if (!job) {
            return { status: 'not_found' };
        }
        const state = await job.getState();
        if (state === 'completed') {
            return { status: 'completed', csv: job.returnvalue };
        }
        if (state === 'failed') {
            return { status: 'failed', error: job.failedReason };
        }
        return { status: state };
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
    (0, swagger_1.ApiOperation)({ summary: 'Export a CSV file for a report type (synchronous fallback)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "export", null);
__decorate([
    (0, common_1.Get)('saved'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'List saved reports accessible to the current user' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Array of saved reports (own + org-wide shared), ordered by createdAt desc' }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getSavedReports", null);
__decorate([
    (0, common_1.Post)('saved'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new saved report' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Saved report created' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_saved_report_dto_1.CreateSavedReportDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "createSavedReport", null);
__decorate([
    (0, common_1.Delete)('saved/:id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a saved report (creator or admin only)' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Saved report deleted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "deleteSavedReport", null);
__decorate([
    (0, common_1.Post)('export-job'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: 'Queue an async CSV export job' }),
    (0, swagger_1.ApiAcceptedResponse)({ description: 'Export job queued; returns jobId' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.ACCEPTED }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "queueExport", null);
__decorate([
    (0, common_1.Get)('export-job/:jobId'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Poll the status of an async CSV export job' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Job status with optional csv/error fields' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getExportStatus", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('reports'),
    __param(1, (0, bull_1.InjectQueue)('reports')),
    __metadata("design:paramtypes", [reports_service_1.ReportsService, Object])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map