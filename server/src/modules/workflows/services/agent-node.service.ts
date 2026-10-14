import { Injectable } from '@nestjs/common';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { IAgentNodeService } from '../interfaces/IAgentNodeService';
import { AddLogFunction } from '../interfaces/IWorkflowExecutionsService';

@Injectable()
export class AgentNodeService implements IAgentNodeService {
  constructor() { }

  async executeAgentNode(
    currentNode: WorkflowExecutionNode,
    nodeState: Record<string, any>,
    addLog: AddLogFunction,
    organizationId: string,
    environmentId: string,
    workflowDefinition: any,
    onToolExecuted: (toolNodeIdOnDefinition: string, result: any, state: Record<string, any>) => Promise<void>,
    createAddLogFunction: any,
    logs: any[],
    bundleContent?: string | null,
    isolate?: any | null,
    context?: any | null,
    execution?: any | null,
    user?: any | null,
    response?: any | null,
    executionStartTime?: Date | null,
    terminationRegistry?: any | null,
    executionId?: string | null,
  ): Promise<{
    status: string;
    data: any;
    error?: {
      message: string;
      stack?: string;
    };
  }> {
    throw new Error('Method not implemented.');
  }
}
