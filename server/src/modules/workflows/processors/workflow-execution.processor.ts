import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowExecutionProcessor {
    constructor() { }

    async process(job: any): Promise<any> {
        throw new Error('Method not implemented.');
    }
}
