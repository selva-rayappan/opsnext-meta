import { AsyncLocalStorage } from 'async_hooks';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
export interface TenantStore {
    organizationId: string;
}
export declare const TenantContext: AsyncLocalStorage<TenantStore>;
export interface TenantQueryOptions {
    skipTenantFilter?: true;
}
export declare class TenantPrismaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private resolveOrgId;
    findMany<M extends Prisma.ModelName>(model: M, args?: Prisma.TypeMap['model'][M]['operations']['findMany']['args'], opts?: TenantQueryOptions): Prisma.TypeMap['model'][M]['operations']['findMany']['result'];
    findFirst<M extends Prisma.ModelName>(model: M, args?: Prisma.TypeMap['model'][M]['operations']['findFirst']['args'], opts?: TenantQueryOptions): Prisma.TypeMap['model'][M]['operations']['findFirst']['result'];
    findUnique<M extends Prisma.ModelName>(model: M, args: Prisma.TypeMap['model'][M]['operations']['findUnique']['args'], opts?: TenantQueryOptions): Prisma.TypeMap['model'][M]['operations']['findUnique']['result'];
    create<M extends Prisma.ModelName>(model: M, args: Prisma.TypeMap['model'][M]['operations']['create']['args'], opts?: TenantQueryOptions): Prisma.TypeMap['model'][M]['operations']['create']['result'];
    update<M extends Prisma.ModelName>(model: M, args: Prisma.TypeMap['model'][M]['operations']['update']['args'], opts?: TenantQueryOptions): Prisma.TypeMap['model'][M]['operations']['update']['result'];
    updateMany<M extends Prisma.ModelName>(model: M, args: Prisma.TypeMap['model'][M]['operations']['updateMany']['args'], opts?: TenantQueryOptions): Prisma.TypeMap['model'][M]['operations']['updateMany']['result'];
    delete<M extends Prisma.ModelName>(model: M, args: Prisma.TypeMap['model'][M]['operations']['delete']['args'], opts?: TenantQueryOptions): Prisma.TypeMap['model'][M]['operations']['delete']['result'];
    count<M extends Prisma.ModelName>(model: M, args?: Prisma.TypeMap['model'][M]['operations']['count']['args'], opts?: TenantQueryOptions): Prisma.TypeMap['model'][M]['operations']['count']['result'];
    get $transaction(): PrismaService['$transaction'];
    get raw(): PrismaService;
    private delegate;
}
