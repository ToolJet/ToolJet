// Dummy workflow data for development and testing
// Follow the same pattern as datasourceData.js

export const workflowTemplates = [
  {
    id: 'blank',
    name: 'Blank Workflow',
    description: 'Start from scratch with an empty workflow canvas',
    icon: 'FileText',
    category: 'basic',
  },
  {
    id: 'data-sync',
    name: 'Data Sync Workflow',
    description: 'Synchronize data between different sources automatically',
    icon: 'RefreshCw',
    category: 'integration',
  },
  {
    id: 'api-integration',
    name: 'API Integration Workflow',
    description: 'Connect and orchestrate multiple API calls',
    icon: 'Globe',
    category: 'integration',
  },
  {
    id: 'scheduled-task',
    name: 'Scheduled Task Workflow',
    description: 'Run automated tasks on a schedule',
    icon: 'Clock',
    category: 'automation',
  },
  {
    id: 'event-driven',
    name: 'Event-Driven Workflow',
    description: 'Trigger workflows based on events and webhooks',
    icon: 'Zap',
    category: 'automation',
  },
];

export const triggerTypes = [
  {
    id: 'manual',
    name: 'Manual',
    description: 'Trigger workflow manually',
    icon: 'Play',
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'Run on a schedule (cron)',
    icon: 'Clock',
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Trigger via HTTP webhook',
    icon: 'Globe',
  },
  {
    id: 'event',
    name: 'Event',
    description: 'Trigger on system events',
    icon: 'Zap',
  },
];

export const workflowStatuses = [
  {
    id: 'active',
    name: 'Active',
    color: 'green',
  },
  {
    id: 'inactive',
    name: 'Inactive',
    color: 'gray',
  },
  {
    id: 'draft',
    name: 'Draft',
    color: 'yellow',
  },
];

// Dummy workflows for development
export const dummyWorkflows = [
  {
    id: 'wf-1',
    name: 'Daily Data Sync',
    status: 'active',
    trigger: 'schedule',
    lastRun: new Date('2024-12-15T10:30:00'),
    createdAt: new Date('2024-12-01T08:00:00'),
    updatedAt: new Date('2024-12-15T10:30:00'),
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
    description: 'Syncs customer data from CRM to database daily',
  },
  {
    id: 'wf-2',
    name: 'Order Processing',
    status: 'active',
    trigger: 'webhook',
    lastRun: new Date('2024-12-16T09:15:00'),
    createdAt: new Date('2024-11-15T14:20:00'),
    updatedAt: new Date('2024-12-16T09:15:00'),
    user: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    },
    description: 'Processes new orders and sends notifications',
  },
  {
    id: 'wf-3',
    name: 'Report Generator',
    status: 'inactive',
    trigger: 'manual',
    lastRun: new Date('2024-12-10T16:00:00'),
    createdAt: new Date('2024-10-20T11:30:00'),
    updatedAt: new Date('2024-12-10T16:00:00'),
    user: {
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
    },
    description: 'Generates monthly sales reports',
  },
  {
    id: 'wf-4',
    name: 'Inventory Alert',
    status: 'draft',
    trigger: 'event',
    lastRun: null,
    createdAt: new Date('2024-12-14T13:45:00'),
    updatedAt: new Date('2024-12-14T13:45:00'),
    user: {
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.williams@example.com',
    },
    description: 'Alerts when inventory falls below threshold',
  },
];
