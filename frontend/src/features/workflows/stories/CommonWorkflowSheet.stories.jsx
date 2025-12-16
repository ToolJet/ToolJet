import React from 'react';
import { CommonWorkflowSheet } from '../components/CommonWorkflowSheet';
import { CreateWorkflowContent } from '../components/CreateWorkflowContent';
import { ConfigureWorkflowContent } from '../components/ConfigureWorkflowContent';
import { workflowTemplates } from '../adapters/workflowData';

const meta = {
  component: CommonWorkflowSheet,
  title: 'Features/Workflows/Components/CommonWorkflowSheet',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Reusable sheet wrapper for workflow-related dialogs and forms.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls sheet visibility',
    },
    title: {
      control: 'text',
      description: 'Sheet title',
    },
    onOpenChange: { action: 'open state changed' },
  },
};

export default meta;

const WithCreateContentComponent = (args) => {
  const [isOpen, setIsOpen] = React.useState(args.open);

  React.useEffect(() => {
    setIsOpen(args.open);
  }, [args.open]);

  return (
    <>
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '10px 20px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Open Template Selection
        </button>
      </div>
      <CommonWorkflowSheet
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          args.onOpenChange?.(open);
        }}
        title={args.title}
      >
        <CreateWorkflowContent onSelectTemplate={(template) => console.log('Selected:', template)} />
      </CommonWorkflowSheet>
    </>
  );
};

export const WithCreateContent = {
  args: {
    open: true,
    title: 'Select workflow template',
  },
  render: WithCreateContentComponent,
};

const WithConfigureContentComponent = (args) => {
  const [isOpen, setIsOpen] = React.useState(args.open);

  React.useEffect(() => {
    setIsOpen(args.open);
  }, [args.open]);

  return (
    <>
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '10px 20px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Open Workflow Configuration
        </button>
      </div>
      <CommonWorkflowSheet
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          args.onOpenChange?.(open);
        }}
        title={args.title}
      >
        <ConfigureWorkflowContent
          template={workflowTemplates[1]}
          onSubmit={(config) => {
            console.log('Submitted:', config);
            setIsOpen(false);
          }}
        />
      </CommonWorkflowSheet>
    </>
  );
};

export const WithConfigureContent = {
  args: {
    open: true,
    title: 'Create Data Sync Workflow',
  },
  render: WithConfigureContentComponent,
};

const TwoStepFlowComponent = (args) => {
  const [createSheetOpen, setCreateSheetOpen] = React.useState(args.open);
  const [configSheetOpen, setConfigSheetOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState(null);

  React.useEffect(() => {
    setCreateSheetOpen(args.open);
  }, [args.open]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setCreateSheetOpen(false);
    setConfigSheetOpen(true);
  };

  const handleSubmit = (config) => {
    console.log('Workflow created:', { template: selectedTemplate, config });
    setConfigSheetOpen(false);
    setSelectedTemplate(null);
  };

  return (
    <>
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setCreateSheetOpen(true)}
          style={{
            padding: '10px 20px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Start Workflow Creation
        </button>
        {selectedTemplate && (
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#6B7280' }}>
            <strong>Selected Template:</strong> {selectedTemplate.name}
          </div>
        )}
      </div>

      <CommonWorkflowSheet open={createSheetOpen} onOpenChange={setCreateSheetOpen} title="Select workflow template">
        <CreateWorkflowContent onSelectTemplate={handleSelectTemplate} />
      </CommonWorkflowSheet>

      <CommonWorkflowSheet
        open={configSheetOpen}
        onOpenChange={setConfigSheetOpen}
        title={selectedTemplate ? `Create ${selectedTemplate.name}` : 'Create workflow'}
      >
        <ConfigureWorkflowContent template={selectedTemplate} onSubmit={handleSubmit} />
      </CommonWorkflowSheet>
    </>
  );
};

export const TwoStepFlow = {
  args: {
    open: true,
  },
  render: TwoStepFlowComponent,
};

const CustomContentComponent = (args) => {
  const [isOpen, setIsOpen] = React.useState(args.open);

  React.useEffect(() => {
    setIsOpen(args.open);
  }, [args.open]);

  return (
    <>
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '10px 20px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Open Custom Sheet
        </button>
      </div>
      <CommonWorkflowSheet
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          args.onOpenChange?.(open);
        }}
        title={args.title}
      >
        <div style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Custom Content</h3>
          <p style={{ marginBottom: '12px', color: '#6B7280', lineHeight: '1.6' }}>
            The CommonWorkflowSheet component is a flexible wrapper that can contain any content. It provides consistent
            styling and behavior for all workflow-related sheets.
          </p>
          <div style={{ padding: '16px', background: '#F3F4F6', borderRadius: '8px', marginTop: '16px' }}>
            <code style={{ fontSize: '13px' }}>You can put any React components here!</code>
          </div>
        </div>
      </CommonWorkflowSheet>
    </>
  );
};

export const CustomContent = {
  args: {
    open: true,
    title: 'Custom Sheet Content',
  },
  render: CustomContentComponent,
};
