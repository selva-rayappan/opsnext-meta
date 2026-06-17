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
exports.TenantPrismaService = exports.TenantContext = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
const prisma_service_1 = require("./prisma.service");
exports.TenantContext = new async_hooks_1.AsyncLocalStorage();
let TenantPrismaService = class TenantPrismaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    resolveOrgId(opts) {
        if (opts?.skipTenantFilter === true) {
            return null;
        }
        const store = exports.TenantContext.getStore();
        if (!store?.organizationId) {
            throw new common_1.ForbiddenException('Tenant context missing');
        }
        return store.organizationId;
    }
    findMany(model, args = {}, opts) {
        const orgId = this.resolveOrgId(opts);
        const delegate = this.delegate(model);
        const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
        return delegate.findMany(merged);
    }
    findFirst(model, args = {}, opts) {
        const orgId = this.resolveOrgId(opts);
        const delegate = this.delegate(model);
        const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
        return delegate.findFirst(merged);
    }
    findUnique(model, args, opts) {
        const orgId = this.resolveOrgId(opts);
        const delegate = this.delegate(model);
        const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
        return delegate.findFirst(merged);
    }
    create(model, args, opts) {
        const orgId = this.resolveOrgId(opts);
        const delegate = this.delegate(model);
        const merged = orgId ? mergeData(args, { organizationId: orgId }) : args;
        return delegate.create(merged);
    }
    update(model, args, opts) {
        const orgId = this.resolveOrgId(opts);
        const delegate = this.delegate(model);
        const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
        return delegate.update(merged);
    }
    updateMany(model, args, opts) {
        const orgId = this.resolveOrgId(opts);
        const delegate = this.delegate(model);
        const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
        return delegate.updateMany(merged);
    }
    delete(model, args, opts) {
        const orgId = this.resolveOrgId(opts);
        const delegate = this.delegate(model);
        const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
        return delegate.delete(merged);
    }
    count(model, args = {}, opts) {
        const orgId = this.resolveOrgId(opts);
        const delegate = this.delegate(model);
        const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
        return delegate.count(merged);
    }
    get $transaction() {
        return this.prisma.$transaction.bind(this.prisma);
    }
    get raw() {
        return this.prisma;
    }
    delegate(model) {
        const key = model.charAt(0).toLowerCase() + model.slice(1);
        const d = this.prisma[key];
        if (!d)
            throw new Error(`Unknown Prisma model: ${model}`);
        return d;
    }
};
exports.TenantPrismaService = TenantPrismaService;
exports.TenantPrismaService = TenantPrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantPrismaService);
function mergeWhere(args, extra) {
    return {
        ...args,
        where: { ...(args['where'] ?? {}), ...extra },
    };
}
function mergeData(args, extra) {
    return {
        ...args,
        data: { ...(args['data'] ?? {}), ...extra },
    };
}
//# sourceMappingURL=tenant-prisma.service.js.map