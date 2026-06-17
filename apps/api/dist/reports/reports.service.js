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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPipelineSummary(orgId, role, userId) {
        const where = { organizationId: orgId };
        if (role === client_1.Role.SALES_REP) {
            where.ownerId = userId;
        }
        const opps = await this.prisma.opportunity.findMany({
            where,
            include: { stage: true },
        });
        const stagesMap = new Map();
        for (const opp of opps) {
            const stageId = opp.stageId;
            const stageName = opp.stage.name;
            const prob = opp.probability;
            const val = opp.amount !== null ? Number(opp.amount) / 100 : 0;
            if (!stagesMap.has(stageId)) {
                stagesMap.set(stageId, {
                    name: stageName,
                    count: 0,
                    totalValue: 0,
                    expectedValue: 0,
                });
            }
            const stageStats = stagesMap.get(stageId);
            stageStats.count += 1;
            stageStats.totalValue += val;
            stageStats.expectedValue += (val * prob) / 100;
        }
        return Array.from(stagesMap.values());
    }
    async getActivityByRep(orgId, role, userId) {
        const where = { organizationId: orgId };
        if (role === client_1.Role.SALES_REP) {
            where.userId = userId;
        }
        const activities = await this.prisma.activity.findMany({
            where,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
        });
        const repMap = new Map();
        for (const act of activities) {
            const repId = act.userId;
            const repName = act.user ? `${act.user.firstName} ${act.user.lastName}` : 'Unknown Rep';
            const repEmail = act.user ? act.user.email : '';
            if (!repMap.has(repId)) {
                repMap.set(repId, {
                    name: repName,
                    email: repEmail,
                    CALL: 0,
                    MEETING: 0,
                    EMAIL_LOG: 0,
                    NOTE: 0,
                    total: 0,
                });
            }
            const repStats = repMap.get(repId);
            const actType = act.type;
            if (actType === 'CALL')
                repStats.CALL += 1;
            else if (actType === 'MEETING')
                repStats.MEETING += 1;
            else if (actType === 'EMAIL_LOG')
                repStats.EMAIL_LOG += 1;
            else if (actType === 'NOTE')
                repStats.NOTE += 1;
            repStats.total += 1;
        }
        return Array.from(repMap.values()).sort((a, b) => b.total - a.total);
    }
    async getLeadFunnel(orgId, role, userId) {
        const where = { organizationId: orgId };
        if (role === client_1.Role.SALES_REP) {
            where.ownerId = userId;
        }
        const leads = await this.prisma.lead.findMany({ where });
        const statusCounts = {
            NEW: 0,
            CONTACTED: 0,
            QUALIFIED: 0,
            UNQUALIFIED: 0,
            CONVERTED: 0,
            total: leads.length,
        };
        for (const lead of leads) {
            const status = lead.status;
            if (status in statusCounts) {
                statusCounts[status] += 1;
            }
        }
        const conversionRate = leads.length > 0 ? (statusCounts.CONVERTED / leads.length) * 100 : 0;
        return {
            statusCounts,
            conversionRate: Math.round(conversionRate * 10) / 10,
        };
    }
    async getWinLossAnalysis(orgId, role, userId) {
        const where = {
            organizationId: orgId,
            status: { in: [client_1.OpportunityStatus.WON, client_1.OpportunityStatus.LOST] },
        };
        if (role === client_1.Role.SALES_REP) {
            where.ownerId = userId;
        }
        const opps = await this.prisma.opportunity.findMany({ where });
        let wonCount = 0;
        let wonValue = 0;
        let lostCount = 0;
        let lostValue = 0;
        for (const opp of opps) {
            const val = opp.amount !== null ? Number(opp.amount) / 100 : 0;
            if (opp.status === client_1.OpportunityStatus.WON) {
                wonCount += 1;
                wonValue += val;
            }
            else {
                lostCount += 1;
                lostValue += val;
            }
        }
        const totalCount = wonCount + lostCount;
        const winRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0;
        return {
            wonCount,
            wonValue,
            lostCount,
            lostValue,
            winRate: Math.round(winRate * 10) / 10,
        };
    }
    async getRevenueForecast(orgId, role, userId) {
        const where = { organizationId: orgId };
        if (role === client_1.Role.SALES_REP) {
            where.ownerId = userId;
        }
        const opps = await this.prisma.opportunity.findMany({
            where,
            include: { stage: true },
        });
        const forecastMap = new Map();
        for (const opp of opps) {
            const closeDate = opp.closeDate;
            const monthStr = closeDate.toISOString().slice(0, 7);
            const val = opp.amount !== null ? Number(opp.amount) / 100 : 0;
            const expectedVal = (val * opp.probability) / 100;
            if (!forecastMap.has(monthStr)) {
                forecastMap.set(monthStr, {
                    month: monthStr,
                    totalValue: 0,
                    expectedValue: 0,
                });
            }
            const item = forecastMap.get(monthStr);
            item.totalValue += val;
            item.expectedValue += expectedVal;
        }
        return Array.from(forecastMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    }
    async exportCsv(type, orgId, role, userId) {
        if (type === 'pipeline-summary') {
            const data = await this.getPipelineSummary(orgId, role, userId);
            let csv = 'Stage Name,Opportunity Count,Total Value (USD),Expected Value (USD)\n';
            for (const row of data) {
                csv += `"${row.name.replace(/"/g, '""')}",${row.count},${row.totalValue},${row.expectedValue}\n`;
            }
            return csv;
        }
        if (type === 'activity-by-rep') {
            const data = await this.getActivityByRep(orgId, role, userId);
            let csv = 'Rep Name,Rep Email,Calls Logged,Meetings Logged,Emails Sent,Notes Logged,Total Activities\n';
            for (const row of data) {
                csv += `"${row.name.replace(/"/g, '""')}","${row.email}",${row.CALL},${row.MEETING},${row.EMAIL_LOG},${row.NOTE},${row.total}\n`;
            }
            return csv;
        }
        if (type === 'lead-funnel') {
            const { statusCounts, conversionRate } = await this.getLeadFunnel(orgId, role, userId);
            let csv = 'Lead Status,Count\n';
            csv += `NEW,${statusCounts.NEW}\n`;
            csv += `CONTACTED,${statusCounts.CONTACTED}\n`;
            csv += `QUALIFIED,${statusCounts.QUALIFIED}\n`;
            csv += `UNQUALIFIED,${statusCounts.UNQUALIFIED}\n`;
            csv += `CONVERTED,${statusCounts.CONVERTED}\n`;
            csv += `TOTAL LEADS,${statusCounts.total}\n`;
            csv += `CONVERSION RATE (%),${conversionRate}%\n`;
            return csv;
        }
        if (type === 'win-loss') {
            const data = await this.getWinLossAnalysis(orgId, role, userId);
            let csv = 'Metric,Value\n';
            csv += `Won Count,${data.wonCount}\n`;
            csv += `Won Value (USD),${data.wonValue}\n`;
            csv += `Lost Count,${data.lostCount}\n`;
            csv += `Lost Value (USD),${data.lostValue}\n`;
            csv += `Win Rate (%),${data.winRate}%\n`;
            return csv;
        }
        if (type === 'revenue-forecast') {
            const data = await this.getRevenueForecast(orgId, role, userId);
            let csv = 'Forecast Month,Total Deal Value (USD),Expected Value (USD)\n';
            for (const row of data) {
                csv += `"${row.month}",${row.totalValue},${row.expectedValue}\n`;
            }
            return csv;
        }
        return 'No data available';
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map