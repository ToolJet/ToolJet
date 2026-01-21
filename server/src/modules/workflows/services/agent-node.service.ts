import { Injectable } from '@nestjs/common';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { IAgentNodeService } from '../interfaces/IAgentNodeService';

type AddLogFunction = (message: string, nodeLabel: string, status: 'normal' | 'success' | 'failure') => void;

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
