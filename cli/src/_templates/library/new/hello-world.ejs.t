---
to: <%= name %>/src/components/HelloWorld/index.tsx
---
import React from "react";
import { ToolJet } from "@tooljet/custom-component-sdk";

export const HelloWorld: React.FC = () => {
  const [firstName, setFirstName] = ToolJet.useStateString({ name: 'firstName', label: 'First Name', initialValue: 'John' });

  // defaultWidth/defaultHeight must be positive whole numbers: defaultWidth is in grid
  // columns, defaultHeight is in grid rows.
  ToolJet.useComponentSettings({ defaultWidth: 5, defaultHeight: 11 });

  ToolJet.useAction({ name: 'reset', displayName: 'Reset' }, () => {
    setFirstName('John');
  });

  return (
    <div>
      <h1>Hello World</h1>
      <p>First Name: {firstName}</p>
    </div>
  );
};
