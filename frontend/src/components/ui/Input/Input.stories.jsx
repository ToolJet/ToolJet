// eslint-disable-next-line no-unused-vars
import * as React from 'react';
import InputComponent from './Index';

// Storybook configuration
export default {
  title: 'Components/Input',
  component: InputComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      options: ['text', 'number', 'editable title', 'password', 'email'],
      control: {
        type: 'select',
      },
    },
    value: {
      control: 'text',
    },
    onChange: {
      control: 'function',
    },
    placeholder: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: {
        type: 'select',
      },
    },
    disabled: {
      control: 'boolean',
    },
    readOnly: {
      if: { arg: 'disabled' },
      control: 'text',
    },
    validation: {
      control: 'function',
    },
    label: {
      control: 'text',
    },
    'aria-label': {
      control: 'text',
    },
    required: {
      control: 'boolean',
    },
    leadingIcon: {
      control: 'text',
    },
    trailingAction: {
      options: ['clear', 'loading'],
      control: 'radio',
    },
    trailingActionDisabled: {
      if: { arg: 'trailingAction', eq: 'clear' },
      control: 'boolean',
    },
    helperText: {
      control: 'text',
    },
  },
};

const Template = (args) => <InputComponent {...args} />;

// Size Variants
export const SizeVariants = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Small (28px height, 12px/18px text)</h3>
      <InputComponent size="small" placeholder="Small input" label="Small Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Medium (32px height, 12px/18px text)</h3>
      <InputComponent size="medium" placeholder="Medium input" label="Medium Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Large (40px height, 14px/20px text)</h3>
      <InputComponent size="large" placeholder="Large input" label="Large Input" />
    </div>
  </div>
);

// Input Types
export const InputTypes = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Text Input</h3>
      <InputComponent type="text" placeholder="Enter text" label="Text Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Number Input</h3>
      <InputComponent type="number" placeholder="00.00" label="Number Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Password Input</h3>
      <InputComponent type="password" placeholder="Enter password" label="Password Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Email Input</h3>
      <InputComponent type="email" placeholder="Enter email" label="Email Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Editable Title</h3>
      <InputComponent type="editable title" placeholder="Editable title" label="Editable Title" />
    </div>
  </div>
);

// States
export const InputStates = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Default</h3>
      <InputComponent placeholder="Default state" label="Default Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Disabled</h3>
      <InputComponent placeholder="Disabled state" label="Disabled Input" disabled />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Required</h3>
      <InputComponent placeholder="Required field" label="Required Input" required />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Helper Text</h3>
      <InputComponent placeholder="With helper text" label="Input with Helper" helperText="This is helper text" />
    </div>
  </div>
);

// With Icons and Actions
export const WithIconsAndActions = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Leading Icon</h3>
      <InputComponent placeholder="Search..." label="Search Input" leadingIcon="search" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Clear Action</h3>
      <InputComponent placeholder="Clearable input" label="Clearable Input" trailingAction="clear" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Loading Action</h3>
      <InputComponent placeholder="Loading input" label="Loading Input" trailingAction="loading" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Both Icons</h3>
      <InputComponent
        placeholder="Search and clear"
        label="Full Featured Input"
        leadingIcon="search"
        trailingAction="clear"
      />
    </div>
  </div>
);

// Size Combinations
export const SizeCombinations = () => (
  <div className="tw-space-y-6">
    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Small Size Combinations</h3>
      <div className="tw-space-y-3">
        <InputComponent size="small" placeholder="Small text input" label="Small Text" />
        <InputComponent size="small" type="number" placeholder="00.00" label="Small Number" />
        <InputComponent size="small" type="password" placeholder="Small password" label="Small Password" />
        <InputComponent size="small" leadingIcon="search" placeholder="Small with icon" label="Small with Icon" />
        <InputComponent size="small" trailingAction="clear" placeholder="Small clearable" label="Small Clearable" />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Medium Size Combinations</h3>
      <div className="tw-space-y-3">
        <InputComponent size="medium" placeholder="Medium text input" label="Medium Text" />
        <InputComponent size="medium" type="number" placeholder="00.00" label="Medium Number" />
        <InputComponent size="medium" type="password" placeholder="Medium password" label="Medium Password" />
        <InputComponent size="medium" leadingIcon="search" placeholder="Medium with icon" label="Medium with Icon" />
        <InputComponent size="medium" trailingAction="clear" placeholder="Medium clearable" label="Medium Clearable" />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Large Size Combinations (14px/20px text)</h3>
      <div className="tw-space-y-3">
        <InputComponent size="large" placeholder="Large text input" label="Large Text" />
        <InputComponent size="large" type="number" placeholder="00.00" label="Large Number" />
        <InputComponent size="large" type="password" placeholder="Large password" label="Large Password" />
        <InputComponent size="large" leadingIcon="search" placeholder="Large with icon" label="Large with Icon" />
        <InputComponent size="large" trailingAction="clear" placeholder="Large clearable" label="Large Clearable" />
        <InputComponent
          size="large"
          type="editable title"
          placeholder="Large editable title"
          label="Large Editable Title"
        />
      </div>
    </div>
  </div>
);

// Interactive Playground
export const Playground = Template.bind({});
Playground.args = {
  type: 'text',
  placeholder: 'Interactive playground',
  name: 'playground',
  id: 'playground',
  size: 'medium',
  label: 'Playground Input',
  'aria-label': 'Interactive input playground',
  helperText: 'Use the controls below to test different combinations',
};
