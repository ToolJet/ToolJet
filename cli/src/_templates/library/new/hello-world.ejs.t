---
to: <%= name %>/src/components/HelloWorld/index.tsx
---
import React from "react";
import { ToolJet } from "@tooljet/custom-component-sdk";

export const HelloWorld: React.FC = () => {
  const [firstName] = ToolJet.useStateString({ name: 'firstName', label: 'First Name', initialValue: 'John' });

  return (
    <div>
      <h1>Hello World</h1>
      <p>First Name: {firstName}</p>
    </div>
  );
};
