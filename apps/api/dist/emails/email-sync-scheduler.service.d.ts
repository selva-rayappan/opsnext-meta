import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
export declare class EmailSyncSchedulerService implements OnModuleInit {
    private readonly emailSyncQueue;
    private readonly logger;
    constructor(emailSyncQueue: Queue);
    onModuleInit(): Promise<void>;
}
