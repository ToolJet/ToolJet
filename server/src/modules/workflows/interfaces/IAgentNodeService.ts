import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { AddLogFunction } from './IWorkflowExecutionsService';

/**
 * Configuration for AI model used in agent node
 * Extracted from AI model datasource connected to agent via 'ai-model' handle
 */
export interface AgentAIModelConfig {
  /** AI provider (e.g., 'openai', 'anthropic', 'gemini', 'mistral_ai') */
  provider: string;
  /** Model name/identifier (e.g., 'gpt-4', 'claude-3-opus') */
  model: string;
  /** API key for the provider (decrypted from datasource options) */
  apiKey: string;
  /** Sampling temperature (0-1, higher = more random) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top-p sampling parameter (0-1) */
  topP?: number;
  /** Maximum number of agent steps/iterations */
  maxSteps?: number;
  /** Maximum retry attempts for API calls */
  maxRetries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Stop sequences to end generation */
  stopSequences?: string[];
  /** Additional properties from parsedQueryOptions */
  [key: string]: any;
}

export interface IAgentNodeService {
  executeAgentNode(
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
  }>;
}
