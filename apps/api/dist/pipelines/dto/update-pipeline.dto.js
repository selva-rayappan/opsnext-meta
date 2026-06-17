"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePipelineDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_pipeline_dto_1 = require("./create-pipeline.dto");
class UpdatePipelineDto extends (0, swagger_1.PartialType)(create_pipeline_dto_1.CreatePipelineDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdatePipelineDto = UpdatePipelineDto;
//# sourceMappingURL=update-pipeline.dto.js.map