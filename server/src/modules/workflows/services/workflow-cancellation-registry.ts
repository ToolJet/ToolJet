import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowCancellationRegistry {
    constructor() { }

    async requestCancellation(executionId: string, timeoutSeconds?: number): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async isCancelled(executionId: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    async clear(executionId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
