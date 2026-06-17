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
exports.EmailsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const shared_1 = require("@opsnext/shared");
const emails_service_1 = require("./emails.service");
const compose_email_dto_1 = require("./dto/compose-email.dto");
const reply_email_dto_1 = require("./dto/reply-email.dto");
const TRACKING_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
let EmailsController = class EmailsController {
    constructor(service) {
        this.service = service;
    }
    listThreads(contactId, opportunityId, user) {
        return this.service.listThreads(user.orgId, contactId, opportunityId);
    }
    getThread(id, user) {
        return this.service.getThread(id, user.orgId);
    }
    compose(dto, user) {
        return this.service.compose(dto, user.sub, user.orgId);
    }
    reply(id, dto, user) {
        return this.service.reply(id, dto, user.sub, user.orgId);
    }
    async trackOpen(messageId, req, res) {
        this.service
            .recordTrackingEvent(messageId, 'OPEN', null, req.ip, req.headers['user-agent'])
            .catch(() => { });
        res.setHeader('Content-Type', 'image/gif');
        res.setHeader('Cache-Control', 'no-store, no-cache');
        res.send(TRACKING_GIF);
    }
    async trackClick(messageId, encodedUrl, req, res) {
        const url = Buffer.from(encodedUrl, 'base64url').toString('utf8');
        this.service
            .recordTrackingEvent(messageId, 'CLICK', url, req.ip, req.headers['user-agent'])
            .catch(() => { });
        res.redirect(302, url);
    }
};
exports.EmailsController = EmailsController;
__decorate([
    (0, common_1.Get)('threads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'List email threads for the organization' }),
    (0, swagger_1.ApiOkResponse)({ description: 'List of threads with last message preview' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('contactId')),
    __param(1, (0, common_1.Query)('opportunityId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], EmailsController.prototype, "listThreads", null);
__decorate([
    (0, common_1.Get)('threads/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN, shared_1.Role.READ_ONLY),
    (0, swagger_1.ApiOperation)({ summary: 'Get email thread with all messages' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Thread with messages and tracking events' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Thread not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmailsController.prototype, "getThread", null);
__decorate([
    (0, common_1.Post)('threads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Compose and send a new email (creates thread)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Created thread and first message' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compose_email_dto_1.ComposeEmailDto, Object]),
    __metadata("design:returntype", void 0)
], EmailsController.prototype, "compose", null);
__decorate([
    (0, common_1.Post)('threads/:id/reply'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(shared_1.Role.SALES_REP, shared_1.Role.SALES_MANAGER, shared_1.Role.ADMIN, shared_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reply to an existing email thread' }),
    (0, swagger_1.ApiOkResponse)({ description: 'New reply message' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Thread not found' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reply_email_dto_1.ReplyEmailDto, Object]),
    __metadata("design:returntype", void 0)
], EmailsController.prototype, "reply", null);
__decorate([
    (0, common_1.Get)('track/open/:messageId'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Record email open event (returns 1x1 GIF)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "trackOpen", null);
__decorate([
    (0, common_1.Get)('track/click/:messageId/:encodedUrl'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Record click event and redirect to original URL' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Param)('encodedUrl')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "trackClick", null);
exports.EmailsController = EmailsController = __decorate([
    (0, swagger_1.ApiTags)('emails'),
    (0, common_1.Controller)('emails'),
    __metadata("design:paramtypes", [emails_service_1.EmailsService])
], EmailsController);
//# sourceMappingURL=emails.controller.js.map