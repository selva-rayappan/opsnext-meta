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
exports.CreateStageDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateStageDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, probability: { required: false, type: () => Number, minimum: 0, maximum: 100 }, stageType: { required: false, type: () => Object } };
    }
}
exports.CreateStageDto = CreateStageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The name of the stage' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStageDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The probability associated with the stage (0-100)', default: 50 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateStageDto.prototype, "probability", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The type of the stage (OPEN, WON, LOST)', enum: client_1.StageType, default: client_1.StageType.OPEN }),
    (0, class_validator_1.IsEnum)(client_1.StageType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStageDto.prototype, "stageType", void 0);
//# sourceMappingURL=create-stage.dto.js.map