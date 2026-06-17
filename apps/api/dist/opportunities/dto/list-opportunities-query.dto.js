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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListOpportunitiesQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class ListOpportunitiesQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 25;
        this.sortBy = 'createdAt';
        this.order = 'desc';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: true, type: () => Number, default: 1, minimum: 1 }, limit: { required: true, type: () => Number, default: 25, minimum: 1, maximum: 100 }, q: { required: false, type: () => String }, status: { required: false, type: () => Object }, pipelineId: { required: false, type: () => String }, stageId: { required: false, type: () => String }, ownerId: { required: false, type: () => String }, sortBy: { required: true, type: () => Object, default: "createdAt", enum: ['name', 'amount', 'closeDate', 'createdAt', 'probability'] }, order: { required: true, type: () => Object, default: "desc", enum: ['asc', 'desc'] } };
    }
}
exports.ListOpportunitiesQueryDto = ListOpportunitiesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1, minimum: 1, description: 'Page number (1-based)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListOpportunitiesQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 25, minimum: 1, maximum: 100, description: 'Items per page (max 100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListOpportunitiesQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search query across opportunity name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListOpportunitiesQueryDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.OpportunityStatus, description: 'Filter by status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OpportunityStatus),
    __metadata("design:type", String)
], ListOpportunitiesQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by pipeline UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListOpportunitiesQueryDto.prototype, "pipelineId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by stage UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListOpportunitiesQueryDto.prototype, "stageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by owner UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListOpportunitiesQueryDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['name', 'amount', 'closeDate', 'createdAt', 'probability'],
        default: 'createdAt',
        description: 'Field to sort by',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['name', 'amount', 'closeDate', 'createdAt', 'probability']),
    __metadata("design:type", String)
], ListOpportunitiesQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort direction',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], ListOpportunitiesQueryDto.prototype, "order", void 0);
//# sourceMappingURL=list-opportunities-query.dto.js.map