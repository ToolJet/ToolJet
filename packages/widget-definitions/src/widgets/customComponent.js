export const customComponentConfig = {
  name: 'CustomComponent',
  displayName: 'Custom Component',
  description: 'Create React components',
  component: 'CustomComponent',
  properties: {
    data: { type: 'code', displayName: 'Data', validation: { schema: { type: 'object' }, defaultValue: '{}' } },
    code: { type: 'code', displayName: 'Code' },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        { displayName: 'Plain text', value: 'plainText' },
        { displayName: 'Markdown', value: 'markdown' },
        { displayName: 'HTML', value: 'html' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'plainText' },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  defaultSize: {
    width: 20,
    height: 140,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  events: {},
  styles: {
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
      accordian: 'container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: false },
      accordian: 'container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'string' }, defaultValue: '0px 0px 0px 0px #00000040' },
      accordian: 'container',
    },
  },
  exposedVariables: {
    data: { value: `{{{ title: 'Hi! There', buttonText: 'Update Title'}}}` },
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: `{{true}}`, type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      visibility: { value: '{{true}}' },
      tooltipFormat: { value: 'plainText' },
      tooltip: { value: '' },
      data: {
        value: `{{{ title: 'Hi! There', buttonText: 'Update Title'}}}`,
      },
      code: {
        value: `import React from 'https://cdn.jsdelivr.net/npm/react@17.0.2/+esm';
  import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@17.0.2/+esm';
  import { Button, Container } from 'https://cdn.jsdelivr.net/npm/@material-ui/core@4.12.4/+esm';
  const MyCustomComponent = ({data, updateData, runQuery}) => (
    <Container>
        <h1>{data.title}</h1>
        <Button
          color="primary"
          variant="outlined"
          onClick={() => {updateData({title: 'Hello World!!'})}}
        >
          {data.buttonText}
        </Button>
      </Container>
  );
  const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
  ReactDOM.render(<ConnectedComponent />, document.body);`,
        skipResolve: true,
      },
    },
    events: [],
    styles: {
      borderRadius: { value: '{{6}}' },
      borderColor: { value: 'var(--cc-weak-border)' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
