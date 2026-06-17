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
exports.EmailIntegrationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const shared_1 = require("@opsnext/shared");
const email_integrations_service_1 = require("./email-integrations.service");
const upsert_email_integration_dto_1 = require("./dto/upsert-email-integration.dto");
let EmailIntegrationsController = class EmailIntegrationsController {
    constructor(service) {
        this.service = service;
    }
    findOne(user) {
        return this.service.findByOrg(user.orgId);
    }
    upsert(dto, user) {
        return this.service.upsert(user.orgId, dto);
    }
    remove(user) {
        return this.service.remove(user.orgId);
    }
    testSmtp(user) {
        return this.service.testSmtp(user.orgId);
    }
};
exports.EmailIntegrationsController = EmailIntegrationsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get current organization email integration' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Email integration config (passwords omitted)' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmailIntegrationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update email integration' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Upserted email integration (passwords omitted)' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_email_integration_dto_1.UpsertEmailIntegrationDto, Object]),
    __metadata("design:returntype", void 0)
], EmailIntegrationsController.prototype, "upsert", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Remove email integration' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Integration deleted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmailIntegrationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Test SMTP connection' }),
    (0, swagger_1.ApiOkResponse)({ description: '{ success: boolean, error?: string }' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmailIntegrationsController.prototype, "testSmtp", null);
exports.EmailIntegrationsController = EmailIntegrationsController = __decorate([
    (0, swagger_1.ApiTags)('email-integrations'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('email-integrations'),
    __metadata("design:paramtypes", [email_integrations_service_1.EmailIntegrationsService])
], EmailIntegrationsController);
//# sourceMappingURL=email-integrations.controller.js.map