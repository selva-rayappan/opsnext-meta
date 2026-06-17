"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStageDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_stage_dto_1 = require("./create-stage.dto");
class UpdateStageDto extends (0, swagger_1.PartialType)(create_stage_dto_1.CreateStageDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateStageDto = UpdateStageDto;
//# sourceMappingURL=update-stage.dto.js.map