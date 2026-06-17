"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCustomFieldDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_custom_field_dto_1 = require("./create-custom-field.dto");
class UpdateCustomFieldDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_custom_field_dto_1.CreateCustomFieldDto, ['entityType'])) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateCustomFieldDto = UpdateCustomFieldDto;
//# sourceMappingURL=update-custom-field.dto.js.map