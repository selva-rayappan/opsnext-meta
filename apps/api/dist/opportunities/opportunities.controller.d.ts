import { UserPayload } from '@opsnext/shared';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { ForecastQueryDto } from './dto/forecast-query.dto';
import { ChangeStageDto } from './dto/change-stage.dto';
import { MarkWonDto } from './dto/mark-won.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
export declare class OpportunitiesController {
    private readonly service;
    constructor(service: OpportunitiesService);
    findAll(query: ListOpportunitiesQueryDto, user: UserPayload): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getForecast(query: ForecastQueryDto, user: UserPayload): Promise<{
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
    findOne(id: string, user: UserPayload): Promise<any>;
    create(dto: CreateOpportunityDto, user: UserPayload): Promise<any>;
    update(id: string, dto: UpdateOpportunityDto, user: UserPayload): Promise<any>;
    changeStage(id: string, body: ChangeStageDto, user: UserPayload): Promise<any>;
    markWon(id: string, dto: MarkWonDto, user: UserPayload): Promise<any>;
    markLost(id: string, dto: MarkLostDto, user: UserPayload): Promise<any>;
    remove(id: string, user: UserPayload): Promise<void>;
}
