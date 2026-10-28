export type ReachedNodeValidationInput = {
  type: string;
  definition?: Record<string, unknown>;
  incomingEdgeCount?: number;
  isResume?: boolean;
  // Child workflow runs cannot pause.
  calledFromWorkflow?: boolean;
};

export class WorkflowNodeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowNodeConfigurationError';
  }
}

const isNonBlankString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function validateReachedNodeConfiguration({
  type,
  definition = {},
  incomingEdgeCount,
  isResume = false,
  calledFromWorkflow = false,
}: ReachedNodeValidationInput): void {
  if (calledFromWorkflow && (type === 'human' || type === 'wait')) {
    throw new WorkflowNodeConfigurationError(
      `${type === 'human' ? 'Human' : 'Wait'} nodes are not supported in workflows called from another workflow`
    );
  }

  switch (type) {
    case 'if-condition': {
      const conditions = Array.isArray(definition.conditions)
        ? definition.conditions
        : [{ label: 'If', code: definition.code }];

      if (conditions.length === 0) {
        throw new WorkflowNodeConfigurationError('If requires at least one condition');
      }

      for (const [index, condition] of conditions.entries()) {
        const branch = condition && typeof condition === 'object' ? condition : {};
        if (!isNonBlankString(branch.code)) {
          // Name by position, as the canvas does; stored labels can be stale.
          const label = index === 0 ? 'If' : `Else if ${index}`;
          throw new WorkflowNodeConfigurationError(`If condition "${label}" cannot be empty`);
        }
      }
      return;
    }

    case 'filter':
      if (incomingEdgeCount !== 1) {
        throw new WorkflowNodeConfigurationError(
          incomingEdgeCount === 0
            ? 'Filter requires one upstream input connection'
            : 'Filter accepts exactly one upstream input connection'
        );
      }
      if (!isNonBlankString(definition.inputExpression)) {
        throw new WorkflowNodeConfigurationError('Filter input expression cannot be empty');
      }
      if (!isNonBlankString(definition.predicateExpression)) {
        throw new WorkflowNodeConfigurationError('Filter condition cannot be empty');
      }
      return;

    case 'wait':
      if (!isResume) {
        const duration = definition.durationSeconds;
        if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 1 || duration > 2_592_000) {
          throw new WorkflowNodeConfigurationError('Wait duration must be between 1 second and 30 days');
        }
      }
      return;

    case 'human':
      if (!isResume) {
        if (!Array.isArray(definition.outcomes) || definition.outcomes.length === 0) {
          throw new WorkflowNodeConfigurationError('Human approval requires at least one outcome');
        }
        const approvers = definition.approvers;
        if (approvers && typeof approvers === 'object' && !Array.isArray(approvers)) {
          const config = approvers as Record<string, unknown>;
          const hasUsers = Array.isArray(config.users) && config.users.length > 0;
          const hasGroups = Array.isArray(config.groups) && config.groups.length > 0;
          if (config.tokenBypass === false && !hasUsers && !hasGroups && !isNonBlankString(config.dynamic)) {
            throw new WorkflowNodeConfigurationError(
              'Human approval requires at least one approver when token bypass is disabled'
            );
          }
        }
      }
      return;

    case 'query':
      if (definition.looped === true && !isNonBlankString(definition.iterationValuesCode)) {
        throw new WorkflowNodeConfigurationError('Loop array expression cannot be empty');
      }
      return;

    default:
      return;
  }
}
