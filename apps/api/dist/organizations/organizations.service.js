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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
let OrganizationsService = class OrganizationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(name) {
        const baseSlug = slugify(name);
        if (!baseSlug) {
            throw new common_1.ConflictException('Organization name produces an invalid slug');
        }
        let slug = baseSlug;
        let suffix = 2;
        while (true) {
            const existing = await this.prisma.organization.findUnique({ where: { slug } });
            if (!existing)
                break;
            slug = `${baseSlug}-${suffix}`;
            suffix++;
        }
        return this.prisma.organization.create({
            data: {
                name: name.trim(),
                slug,
                status: client_1.OrganizationStatus.ACTIVE,
            },
        });
    }
    async findById(id) {
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('Organisation not found');
        return org;
    }
    async findBySlug(slug) {
        const org = await this.prisma.organization.findUnique({ where: { slug } });
        if (!org)
            throw new common_1.NotFoundException('Organisation not found');
        return org;
    }
    async suspend(id) {
        await this.findById(id);
        return this.prisma.organization.update({
            where: { id },
            data: { status: client_1.OrganizationStatus.SUSPENDED },
        });
    }
    async delete(id) {
        await this.findById(id);
        return this.prisma.organization.update({
            where: { id },
            data: { status: client_1.OrganizationStatus.PENDING_DELETION },
        });
    }
    async scheduleDelete(id) {
        return this.delete(id);
    }
    async getStats(orgId) {
        const [total, active] = await Promise.all([
            this.prisma.user.count({ where: { organizationId: orgId } }),
            this.prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
        ]);
        return { totalUsers: total, activeUsers: active };
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map