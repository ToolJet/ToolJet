---
to: <%= name %>/src/components/HelloWorld/index.tsx
---
import React from "react";
import { ToolJet } from "@tooljet/custom-component-sdk";

export const HelloWorld: React.FC = () => {
  const [firstName, setFirstName] = ToolJet.useStateString({ name: 'firstName', label: 'First Name', initialValue: 'John' });

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
