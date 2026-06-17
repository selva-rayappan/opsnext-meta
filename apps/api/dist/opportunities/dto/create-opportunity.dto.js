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
exports.CreateOpportunityDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateOpportunityDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, amount: { required: false, type: () => Number, minimum: 1 }, currency: { required: false, type: () => String }, closeDate: { required: true, type: () => String }, pipelineId: { required: true, type: () => String }, stageId: { required: true, type: () => String }, contactId: { required: false, type: () => String }, accountId: { required: false, type: () => String }, ownerId: { required: false, type: () => String }, probability: { required: false, type: () => Number, minimum: 0, maximum: 100 } };
    }
}
exports.CreateOpportunityDto = CreateOpportunityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The name of the opportunity' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOpportunityDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The monetary value of the opportunity in dollars' }),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateOpportunityDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The currency code (e.g. USD)', default: 'USD' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOpportunityDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The estimated close date of the deal' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateOpportunityDto.prototype, "closeDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ID of the pipeline' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateOpportunityDto.prototype, "pipelineId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ID of the stage' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateOpportunityDto.prototype, "stageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The ID of the linked contact' }),
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOpportunityDto.prototype, "contactId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The ID of the linked account' }),
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOpportunityDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The ID of the owner user' }),
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOpportunityDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The win probability (0-100)', default: 50 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateOpportunityDto.prototype, "probability", void 0);
//# sourceMappingURL=create-opportunity.dto.js.map