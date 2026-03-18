import React from 'react';
import { CreateWorkflowContent } from '../components/CreateWorkflowContent';

const meta = {
  component: CreateWorkflowContent,
  title: 'Features/Workflows/Components/CreateWorkflowContent',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Template selection UI for creating new workflows with 5 predefined templates.',
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
    onSelectTemplate: { action: 'template selected' },
  },
};

export default meta;

export const Default = {
  args: {},
};

export const WithSearchFilter = {
  args: {},
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input[type="text"]');
    if (input) {
      input.value = 'sync';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
};

const IntegrationCategoryOnlyComponent = (args) => {
  const [selectedCategory, setSelectedCategory] = React.useState('integration');

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '8px 12px',
            marginRight: '8px',
            background: selectedCategory === 'all' ? '#4F46E5' : '#E5E7EB',
            color: selectedCategory === 'all' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        <button
          onClick={() => setSelectedCategory('integration')}
          style={{
            padding: '8px 12px',
            background: selectedCategory === 'integration' ? '#4F46E5' : '#E5E7EB',
            color: selectedCategory === 'integration' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Integration
        </button>
      </div>
      <CreateWorkflowContent {...args} />
    </div>
  );
};

export const IntegrationCategoryOnly = {
  render: IntegrationCategoryOnlyComponent,
  args: {},
};

const WithInteractionComponent = (args) => {
  const [selected, setSelected] = React.useState(null);

  return (
    <div>
      <CreateWorkflowContent
        {...args}
        onSelectTemplate={(template) => {
          setSelected(template);
          args.onSelectTemplate?.(template);
        }}
      />
      {selected && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background: '#F3F4F6',
            borderRadius: '8px',
          }}
        >
          <strong>Selected Template:</strong>
          <pre style={{ marginTop: '8px', fontSize: '12px' }}>{JSON.stringify(selected, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export const WithInteraction = {
  args: {},
  render: WithInteractionComponent,
};
