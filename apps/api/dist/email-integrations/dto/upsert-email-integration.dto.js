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
exports.UpsertEmailIntegrationDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpsertEmailIntegrationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { smtpHost: { required: true, type: () => String }, smtpPort: { required: true, type: () => Number, minimum: 1, maximum: 65535 }, smtpUser: { required: true, type: () => String }, smtpPass: { required: false, type: () => String }, smtpFromName: { required: true, type: () => String }, smtpFromEmail: { required: true, type: () => String }, smtpSecure: { required: false, type: () => Boolean }, imapEnabled: { required: false, type: () => Boolean }, imapHost: { required: false, type: () => String }, imapPort: { required: false, type: () => Number }, imapUser: { required: false, type: () => String }, imapPass: { required: false, type: () => String } };
    }
}
exports.UpsertEmailIntegrationDto = UpsertEmailIntegrationDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertEmailIntegrationDto.prototype, "smtpHost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1, maximum: 65535 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], UpsertEmailIntegrationDto.prototype, "smtpPort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertEmailIntegrationDto.prototype, "smtpUser", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plaintext SMTP password — encrypted before storage' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertEmailIntegrationDto.prototype, "smtpPass", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertEmailIntegrationDto.prototype, "smtpFromName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpsertEmailIntegrationDto.prototype, "smtpFromEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpsertEmailIntegrationDto.prototype, "smtpSecure", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpsertEmailIntegrationDto.prototype, "imapEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertEmailIntegrationDto.prototype, "imapHost", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpsertEmailIntegrationDto.prototype, "imapPort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertEmailIntegrationDto.prototype, "imapUser", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plaintext IMAP password — encrypted before storage' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertEmailIntegrationDto.prototype, "imapPass", void 0);
//# sourceMappingURL=upsert-email-integration.dto.js.map