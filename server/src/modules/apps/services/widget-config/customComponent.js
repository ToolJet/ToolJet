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
      accordian: 'container',
    },
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
        value: `import React, { useMemo, useState, useRef, useEffect, } from "https://esm.sh/react@18.2.0"; 
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import { Button, Container } from 'https://esm.sh/@material-ui/core?deps=react@18.2.0,react-dom@18.2.0';
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
  const root = createRoot(document.body);
  root.render(<ConnectedComponent />);`,
        skipResolve: true,
      },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      borderRadius: { value: '{{6}}' },
      borderColor: { value: 'var(--cc-weak-border)' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
