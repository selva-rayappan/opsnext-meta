import { UserPayload } from '@opsnext/shared';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
export declare class TagsController {
    private readonly tags;
    constructor(tags: TagsService);
    findAll(user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        color: string;
    }[]>;
    create(dto: CreateTagDto, user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        color: string;
    }>;
    update(id: string, dto: UpdateTagDto, user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        color: string;
    }>;
    remove(id: string, user: UserPayload): Promise<void>;
}
