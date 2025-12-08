import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';

type AddLogFunction = (message: string, nodeLabel: string, status: 'normal' | 'success' | 'failure') => void;

export interface IAgentNodeService {
  executeAgentNode(
    currentNode: WorkflowExecutionNode,
    nodeState: Record<string, any>,
    addLog: AddLogFunction,
    organizationId: string,
    environmentId: string,
    workflowDefinition: any
  ): Promise<{
    status: string;
    data: any;
    error?: {
      message: string;
      stack?: string;
    };
  }>;
}
