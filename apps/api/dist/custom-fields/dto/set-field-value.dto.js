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
exports.FilterByEntityTypeQueryDto = exports.GetEntityValuesQueryDto = exports.SetFieldValueDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const create_custom_field_dto_1 = require("./create-custom-field.dto");
class SetFieldValueDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { entityId: { required: true, type: () => String }, entityType: { required: true, type: () => Object, enum: create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES }, value: { required: true, type: () => Object } };
    }
}
exports.SetFieldValueDto = SetFieldValueDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the entity (contact, account, etc.)' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SetFieldValueDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES }),
    (0, class_validator_1.IsIn)(create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES),
    __metadata("design:type", String)
], SetFieldValueDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The value to store. May be a string, number, boolean, date string, or array.',
    }),
    __metadata("design:type", Object)
], SetFieldValueDto.prototype, "value", void 0);
class GetEntityValuesQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { entityType: { required: true, type: () => Object, enum: create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES }, entityId: { required: true, type: () => String } };
    }
}
exports.GetEntityValuesQueryDto = GetEntityValuesQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES }),
    (0, class_validator_1.IsIn)(create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES),
    __metadata("design:type", String)
], GetEntityValuesQueryDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the entity' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetEntityValuesQueryDto.prototype, "entityId", void 0);
class FilterByEntityTypeQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { entityType: { required: false, type: () => Object, enum: create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES } };
    }
}
exports.FilterByEntityTypeQueryDto = FilterByEntityTypeQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES, required: false }),
    (0, class_validator_1.IsIn)(create_custom_field_dto_1.CUSTOM_FIELD_ENTITY_TYPES),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterByEntityTypeQueryDto.prototype, "entityType", void 0);
//# sourceMappingURL=set-field-value.dto.js.map