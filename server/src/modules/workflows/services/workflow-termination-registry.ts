import { Injectable } from '@nestjs/common';

/**
 * Base WorkflowTerminationRegistry for CE
 * This is a stub implementation that throws "Method not implemented" errors.
 * The EE version extends this class and provides actual Redis-based termination tracking.
 */
@Injectable()
export class WorkflowTerminationRegistry {
    constructor() { }

    async requestTermination(executionId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async isTerminated(executionId: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    async clear(executionId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
