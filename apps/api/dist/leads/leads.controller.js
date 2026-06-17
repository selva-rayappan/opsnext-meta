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
exports.LeadsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const shared_1 = require("@opsnext/shared");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const leads_service_1 = require("./leads.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const update_lead_dto_1 = require("./dto/update-lead.dto");
const list_leads_query_dto_1 = require("./dto/list-leads-query.dto");
const convert_lead_dto_1 = require("./dto/convert-lead.dto");
class ChangeStatusBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.LeadStatus, description: 'New lead status (cannot be CONVERTED)' }),
    (0, class_validator_1.IsEnum)(client_1.LeadStatus),
    __metadata("design:type", String)
], ChangeStatusBody.prototype, "status", void 0);
class BulkImportBody {
}
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [create_lead_dto_1.CreateLeadDto], description: 'Array of leads to import' }),
    __metadata("design:type", Array)
], BulkImportBody.prototype, "leads", void 0);
let LeadsController = class LeadsController {
    constructor(leads) {
        this.leads = leads;
    }
    findAll(user, query) {
        return this.leads.findAll(user.orgId, query, user.role, user.sub);
    }
    findOne(id, user) {
        return this.leads.findById(id, user.orgId);
    }
    create(dto, user) {
        return this.leads.create(dto, user.sub, user.orgId);
    }
    bulkImport(dto, user) {
        return this.leads.bulkImport(dto.leads, user.sub, user.orgId);
    }
    update(id, dto, user) {
        return this.leads.update(id, dto, user.sub, user.orgId);
    }
    remove(id, user) {
        return this.leads.delete(id, user.sub, user.orgId);
    }
    changeStatus(id, body, user) {
        return this.leads.changeStatus(id, body.status, user.sub, user.orgId);
    }
    convert(id, dto, user) {
        return this.leads.convert(id, dto, user.sub, user.orgId);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.READ_ONLY, shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List leads (paginated, filterable, sortable)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Paginated lead list' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_leads_query_dto_1.ListLeadsQueryDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ description: "GET /leads/:id", summary: 'Get a lead by ID' }),
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.READ_ONLY, shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOkResponse)({ description: 'Lead record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Lead not found in this organization' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new lead' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Lead created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk-import leads; skips duplicates by email' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Import summary with created/skipped/errors counts' }),
    (0, swagger_1.ApiBody)({ type: BulkImportBody }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BulkImportBody, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update a lead' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated lead record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Lead not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lead_dto_1.UpdateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Hard-delete a lead' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Lead deleted' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Lead not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Change lead status (not CONVERTED — use /convert for that)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated lead record' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Lead not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ChangeStatusBody, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Post)(':id/convert'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Convert a lead to a contact (and optionally an opportunity)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Converted lead with created contact and optional opportunity' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Lead not found' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, convert_lead_dto_1.ConvertLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "convert", null);
exports.LeadsController = LeadsController = __decorate([
    (0, swagger_1.ApiTags)('leads'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map