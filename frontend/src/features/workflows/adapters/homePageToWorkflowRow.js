// Transform workflow data from HomePage format to table row format
// Follow the same pattern as homePageToDatasourceRow.js

import moment from 'moment';

/**
 * Transforms workflow data from the HomePage API format to table row format
 * Preserves the original workflow object for action handlers
 * @param {Object} workflow - Workflow object from HomePage
 * @returns {Object} Transformed row object for DataTable
 */
export const homePageToWorkflowRow = (workflow) => {
  if (!workflow) {
    return null;
  }

  // Helper to safely format dates
  const formatDate = (date) => {
    if (!date) return 'Never';
    try {
      return moment(date).fromNow();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper to get user display name
  const getUserName = (user) => {
    if (!user) return 'Unknown';
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || 'Unknown';
  };

  // Transform to row format
  return {
    id: workflow.id || workflow.workflow_id || '',
    name: workflow.name || 'Untitled Workflow',
    status: workflow.status || 'draft',
    trigger: workflow.trigger || 'manual',
    lastRun: formatDate(workflow.lastRun || workflow.last_run),
    lastEdited: formatDate(workflow.updatedAt || workflow.updated_at),
    editedBy: getUserName(workflow.user),
    description: workflow.description || '',
    
    // Preserve original workflow object for action handlers
    _original: workflow,
      _originalResource: workflow, // Required for permissions to work
    _workflowId: workflow.id || workflow.workflow_id,
    _rawLastRun: workflow.lastRun || workflow.last_run,
    _rawUpdatedAt: workflow.updatedAt || workflow.updated_at,
  };
};

/**
 * Transforms an array of workflows
 * @param {Array} workflows - Array of workflow objects
 * @returns {Array} Array of transformed row objects
 */
export const homePageToWorkflowRows = (workflows) => {
  if (!Array.isArray(workflows)) {
    console.warn('homePageToWorkflowRows: Expected array, received:', typeof workflows);
    return [];
  }

  return workflows.map(homePageToWorkflowRow).filter(Boolean); // Remove any null results
};
