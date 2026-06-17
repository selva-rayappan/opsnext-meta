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
exports.CreateCustomFieldDto = exports.CUSTOM_FIELD_TYPES = exports.CUSTOM_FIELD_ENTITY_TYPES = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
exports.CUSTOM_FIELD_ENTITY_TYPES = [
    'Contact',
    'Account',
    'Lead',
    'Opportunity',
];
exports.CUSTOM_FIELD_TYPES = [
    'text',
    'number',
    'date',
    'boolean',
    'select',
    'multiselect',
];
class CreateCustomFieldDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { entityType: { required: true, type: () => Object, enum: exports.CUSTOM_FIELD_ENTITY_TYPES }, name: { required: true, type: () => String, maxLength: 100 }, fieldType: { required: true, type: () => Object, enum: exports.CUSTOM_FIELD_TYPES }, isRequired: { required: false, type: () => Boolean }, options: { required: false, type: () => [String] }, order: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.CreateCustomFieldDto = CreateCustomFieldDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: exports.CUSTOM_FIELD_ENTITY_TYPES,
        example: 'Contact',
        description: 'Entity type this field applies to',
    }),
    (0, class_validator_1.IsIn)(exports.CUSTOM_FIELD_ENTITY_TYPES),
    __metadata("design:type", String)
], CreateCustomFieldDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'LinkedIn URL', description: 'Field display name (unique per entity type per org)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateCustomFieldDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: exports.CUSTOM_FIELD_TYPES,
        example: 'text',
        description: 'Data type for the field value',
    }),
    (0, class_validator_1.IsIn)(exports.CUSTOM_FIELD_TYPES),
    __metadata("design:type", String)
], CreateCustomFieldDto.prototype, "fieldType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false, description: 'Whether the field is mandatory' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCustomFieldDto.prototype, "isRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Options for select / multiselect fields — array of string option values',
        type: 'array',
        items: { type: 'string' },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCustomFieldDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: 0,
        description: 'Display order within the entity form',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCustomFieldDto.prototype, "order", void 0);
//# sourceMappingURL=create-custom-field.dto.js.map