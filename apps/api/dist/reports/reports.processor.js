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
var ReportsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
let ReportsProcessor = ReportsProcessor_1 = class ReportsProcessor {
    constructor(service) {
        this.service = service;
        this.logger = new common_1.Logger(ReportsProcessor_1.name);
    }
    async exportCsv(job) {
        const { type, orgId, role, userId } = job.data;
        this.logger.log(`Generating CSV export: type=${type}, orgId=${orgId}`);
        const csv = await this.service.exportCsv(type, orgId, role, userId);
        return csv;
    }
};
exports.ReportsProcessor = ReportsProcessor;
__decorate([
    (0, bull_1.Process)('export-csv'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsProcessor.prototype, "exportCsv", null);
exports.ReportsProcessor = ReportsProcessor = ReportsProcessor_1 = __decorate([
    (0, bull_1.Processor)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsProcessor);
//# sourceMappingURL=reports.processor.js.map