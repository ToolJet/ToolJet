import React from 'react';
import { ConfigureWorkflowContent } from '../components/ConfigureWorkflowContent';
import { workflowTemplates } from '../adapters/workflowData';

const meta = {
  component: ConfigureWorkflowContent,
  title: 'Features/Workflows/Components/ConfigureWorkflowContent',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Configuration form for workflows with name, trigger type, description, and enable/disable toggle.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    template: {
      control: 'object',
      description: 'Selected workflow template',
    },
    onSubmit: { action: 'workflow submitted' },
  },
};

export default meta;

export const BlankWorkflow = {
  args: {
    template: workflowTemplates[0], // Blank Workflow
  },
};

export const DataSyncWorkflow = {
  args: {
    template: workflowTemplates[1], // Data Sync Workflow
  },
};

export const APIIntegrationWorkflow = {
  args: {
    template: workflowTemplates[2], // API Integration Workflow
  },
};

export const ScheduledTaskWorkflow = {
  args: {
    template: workflowTemplates[3], // Scheduled Task Workflow
  },
};

export const EventDrivenWorkflow = {
  args: {
    template: workflowTemplates[4], // Event-Driven Workflow
  },
};

const WithFormDataComponent = (args) => {
  const [submittedData, setSubmittedData] = React.useState(null);

  return (
    <div>
      <ConfigureWorkflowContent
        {...args}
        onSubmit={(data) => {
          setSubmittedData(data);
          args.onSubmit?.(data);
        }}
      />
      {submittedData && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background: '#F3F4F6',
            borderRadius: '8px',
          }}
        >
          <strong>Submitted Data:</strong>
          <pre style={{ marginTop: '8px', fontSize: '12px' }}>{JSON.stringify(submittedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export const WithFormData = {
  args: {
    template: workflowTemplates[1],
  },
  render: WithFormDataComponent,
};

export const AllTriggerTypes = {
  args: {
    template: workflowTemplates[0],
  },
  render: (args) => (
    <div>
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
        <strong>All Trigger Types:</strong> Manual, Schedule, Webhook, Event
      </div>
      <ConfigureWorkflowContent {...args} />
    </div>
  ),
};

export const PrefilledForm = {
  args: {
    template: workflowTemplates[1],
  },
  render: (args) => {
    // Note: To prefill, you would need to modify the component to accept initial values
    // This story demonstrates the desired behavior
    return (
      <div>
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#FEF3C7',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          <strong>Note:</strong> This story shows the form as-is. To prefill values, the component would need to accept
          initialValues prop.
        </div>
        <ConfigureWorkflowContent {...args} />
      </div>
    );
  },
};

export const SubmitValidation = {
  args: {
    template: workflowTemplates[0],
  },
  render: (args) => {
    return (
      <div>
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#DBEAFE',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          <strong>Try to submit:</strong> The form requires a workflow name to be filled before submission.
        </div>
        <ConfigureWorkflowContent {...args} />
      </div>
    );
  },
};
