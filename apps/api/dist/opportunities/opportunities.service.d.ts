import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { ForecastQueryDto } from './dto/forecast-query.dto';
import { MarkWonDto } from './dto/mark-won.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
export declare class OpportunitiesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private serializeOpportunity;
    findAll(orgId: string, query: ListOpportunitiesQueryDto, userRole: Role, userId: string): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    findById(id: string, orgId: string): Promise<any>;
    create(dto: CreateOpportunityDto, actorId: string, orgId: string): Promise<any>;
    update(id: string, dto: UpdateOpportunityDto, actorId: string, orgId: string): Promise<any>;
    changeStage(id: string, stageId: string, actorId: string, orgId: string): Promise<any>;
    markWon(id: string, dto: MarkWonDto, actorId: string, orgId: string): Promise<any>;
    markLost(id: string, dto: MarkLostDto, actorId: string, orgId: string): Promise<any>;
    delete(id: string, actorId: string, orgId: string): Promise<void>;
    getForecast(orgId: string, query: ForecastQueryDto, userRole: Role, userId: string): Promise<{
        summary: {
            totalValue: number;
            expectedValue: number;
            count: number;
        };
        monthly: {
            month: string;
            count: number;
            totalValue: number;
            expectedValue: number;
        }[];
    }>;
}
