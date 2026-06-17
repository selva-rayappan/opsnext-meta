import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
export declare class TaskReminderSchedulerService implements OnModuleInit {
    private readonly tasksQueue;
    private readonly logger;
    constructor(tasksQueue: Queue);
    onModuleInit(): Promise<void>;
}
