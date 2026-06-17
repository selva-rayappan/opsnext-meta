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
exports.InviteUserDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@opsnext/shared");
class InviteUserDto {
    constructor() {
        this.role = shared_1.Role.SALES_REP;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String, maxLength: 255 }, role: { required: true, default: shared_1.Role.SALES_REP, enum: require("../../../../../packages/shared/src/types/user.types").Role } };
    }
}
exports.InviteUserDto = InviteUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'jane.doe@example.com', description: 'Email address to invite' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], InviteUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: shared_1.Role,
        default: shared_1.Role.SALES_REP,
        description: 'Role to assign to the invited user. SUPER_ADMIN cannot be invited.',
    }),
    (0, class_validator_1.IsEnum)(shared_1.Role),
    (0, class_validator_1.NotEquals)(shared_1.Role.SUPER_ADMIN, { message: 'SUPER_ADMIN cannot be invited via this endpoint' }),
    __metadata("design:type", String)
], InviteUserDto.prototype, "role", void 0);
//# sourceMappingURL=invite-user.dto.js.map