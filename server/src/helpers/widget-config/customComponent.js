export const customComponentConfig = {
  name: 'CustomComponent',
  displayName: 'Custom Component',
  description: 'Create React components',
  component: 'CustomComponent',
  properties: {
    data: { type: 'code', displayName: 'Data', validation: { schema: { type: 'object' }, defaultValue: '{}' } },
    code: { type: 'code', displayName: 'Code' },
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
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
  },
  exposedVariables: {
    data: { value: `{{{ title: 'Hi! There', buttonText: 'Update Title'}}}` },
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      visible: { value: '{{true}}' },
      data: {
        value: `{{{ title: 'Hi! There', buttonText: 'Update Title'}}}`,
      },
      code: {
        value: `import React from 'https://cdn.skypack.dev/react';
  import ReactDOM from 'https://cdn.skypack.dev/react-dom';
  import { Button, Container } from 'https://cdn.skypack.dev/@material-ui/core';
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
      visibility: { value: '{{true}}' },
    },
  },
};
