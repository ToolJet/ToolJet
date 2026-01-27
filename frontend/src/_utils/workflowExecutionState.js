/**
 * Derives the display state from raw execution data
 * FIXME: We need to simplify states across the board (DB, BullMQ, frontend)
 * with a unified single source of truth at the backend
 *
 * @param {Object} execution - Raw execution object
 * @param {boolean} execution.executed - Has workflow finished?
 * @param {string} execution.status - DB status ('success', 'failed', 'terminated', null)
 * @param {string} [execution.jobState] - BullMQ state ('active', 'waiting', 'delayed', 'completed', 'failed')
 * @param {boolean} [execution.terminationRequested] - Redis termination flag
 * @returns {string} Display state: 'pending' | 'running' | 'terminating' | 'completed' | 'failed' | 'terminated'
 */
export function getExecutionDisplayState(execution) {
  // Already finished in database - this is the final state
  if (execution.executed) {
    if (execution.status === 'terminated') return 'terminated';
    if (execution.status === 'failure') return 'failed';  // Backend saves 'failure', not 'failed'
    if (execution.status === 'success') return 'completed';
    // Fallback for legacy data without explicit status
    return 'completed';
  }

  // Not finished yet - check BullMQ job state
  const jobState = execution.jobState;

  // Job doesn't exist in queue anymore
  // This can happen if job completed but DB not updated yet
  if (!jobState) {
    // Poll will fetch fresh data soon
    return 'completed';
  }

  // Termination requested (Redis flag set)
  if (execution.terminationRequested) {
    return 'terminating';
  }

  // Job is actively being processed by worker
  if (jobState === 'active') {
    return 'running';
  }

  // Job is waiting in queue or delayed
  if (jobState === 'waiting' || jobState === 'delayed') {
    return 'pending';
  }

  // Job completed in BullMQ but DB not updated yet
  // This is a temporary state between BullMQ completion and DB update
  if (jobState === 'completed') {
    return 'completed';
  }

  // Job failed in BullMQ but DB not updated yet
  if (jobState === 'failed') {
    // Check if it's a termination failure vs regular failure
    return execution.terminationRequested ? 'terminated' : 'failed';
  }

  // Default fallback (should rarely happen)
  return 'running';
}

/**
 * Check if execution is in progress (not in final state)
 *
 * @param {Object} execution - Raw execution object
 * @returns {boolean} True if execution is pending, running, or terminating
 */
export function isExecutionInProgress(execution) {
  const state = getExecutionDisplayState(execution);
  return ['pending', 'running', 'terminating'].includes(state);
}

/**
 * Check if execution is in final state
 *
 * @param {Object} execution - Raw execution object
 * @returns {boolean} True if execution is completed, failed, or terminated
 */
export function isExecutionFinished(execution) {
  const state = getExecutionDisplayState(execution);
  return ['completed', 'failed', 'terminated'].includes(state);
}

/**
 * Get display configuration for UI rendering
 *
 * @param {Object} execution - Raw execution object
 * @returns {Object} Display configuration with text, icons, buttons, etc.
 */
export function getExecutionDisplayConfig(execution) {
  const state = getExecutionDisplayState(execution);

  const configs = {
    pending: {
      state: 'pending',
      text: 'In Progress...',
      showSpinner: true,
      showCancelButton: true,
      icon: null
    },
    running: {
      state: 'running',
      text: 'In Progress...',
      showSpinner: true,
      showCancelButton: true,
      icon: null
    },
    terminating: {
      state: 'terminating',
      text: 'Terminating...',
      showSpinner: true,
      showCancelButton: false, // Can't terminate a termination
      icon: null
    },
    completed: {
      state: 'completed',
      text: null, // Will show timestamp instead
      showSpinner: false,
      showCancelButton: false,
      showTime: true,
      icon: 'success'
    },
    failed: {
      state: 'failed',
      text: null, // Will show timestamp instead
      showSpinner: false,
      showCancelButton: false,
      showTime: true,
      icon: 'error'
    },
    terminated: {
      state: 'terminated',
      text: null, // Will show timestamp instead
      showSpinner: false,
      showCancelButton: false,
      showTime: true,
      icon: 'terminated'
    }
  };

  return configs[state] || configs.running; // Fallback to running if unknown state
}

/**
 * Determine if terminate button should be enabled
 *
 * @param {Object} execution - Raw execution object
 * @returns {boolean} True if terminate button should be enabled
 */
export function canTerminateExecution(execution) {
  const state = getExecutionDisplayState(execution);
  // Can only terminate if pending or running (not if already terminating or finished)
  return ['pending', 'running'].includes(state);
}

/**
 * Get user-friendly status text
 *
 * @param {Object} execution - Raw execution object
 * @returns {string} User-friendly status text
 */
export function getExecutionStatusText(execution) {
  const state = getExecutionDisplayState(execution);

  const statusTexts = {
    pending: 'In Progress',
    running: 'In Progress',
    terminating: 'Terminating',
    completed: 'Completed',
    failed: 'Failed',
    terminated: 'Terminated'
  };

  return statusTexts[state] || 'Unknown';
}
