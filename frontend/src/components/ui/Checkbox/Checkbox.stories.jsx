import * as React from 'react';
import CheckboxComponent from './Index';

export default {
  title: 'Components/Checkbox',
  component: CheckboxComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    intermediate: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    helper: {
      control: 'text',
    },
    type: {
      options: ['checkbox', 'radio', 'checkmark'],
      control: 'radio',
    },
    size: {
      options: ['default', 'large'],
      control: 'radio',
    },
    align: {
      options: ['left', 'right'],
      control: 'radio',
    },
    required: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
  },
};

const Template = (args) => <CheckboxComponent {...args} />;

export const RocketCheckbox = Template.bind({});
RocketCheckbox.args = {};

export const RocketRadio = (args) => {
  return <CheckboxComponent {...args} type="radio" />;
};
RocketRadio.args = {
  ...RocketCheckbox.args,
};

export const RocketCheckmark = (args) => {
  return <CheckboxComponent {...args} type="checkmark" />;
};
RocketCheckmark.args = {
  ...RocketCheckbox.args,
};

export const RocketCheckboxWithLabelAndHelper = (args) => {
  return (
    <CheckboxComponent
      {...args}
      type="checkbox"
      label="Remember me"
      helper="Save my login details for next time."
      align="left"
    />
  );
};
RocketCheckboxWithLabelAndHelper.args = {
  ...RocketCheckbox.args,
};

export const RocketCheckboxWithLeadingLabelAndHelper = (args) => {
  return (
    <CheckboxComponent
      {...args}
      type="checkbox"
      label="Remember me"
      helper="Save my login details for next time."
      align="right"
    />
  );
};
RocketCheckboxWithLeadingLabelAndHelper.args = {
  ...RocketCheckbox.args,
};

export const RocketRadioWithLabelAndHelper = (args) => {
  return (
    <CheckboxComponent
      {...args}
      type="radio"
      label="Remember me"
      helper="Save my login details for next time."
      align="left"
    />
  );
};
RocketRadioWithLabelAndHelper.args = {
  ...RocketCheckbox.args,
};

export const RocketRadioWithLeadingLabelAndHelper = (args) => {
  return (
    <CheckboxComponent
      {...args}
      type="radio"
      label="Remember me"
      helper="Save my login details for next time."
      align="right"
    />
  );
};
RocketRadioWithLeadingLabelAndHelper.args = {
  ...RocketCheckbox.args,
};

export const RocketCheckmarkWithLabelAndHelper = (args) => {
  return (
    <CheckboxComponent
      {...args}
      type="checkmark"
      label="Remember me"
      helper="Save my login details for next time."
      align="left"
    />
  );
};
RocketCheckmarkWithLabelAndHelper.args = {
  ...RocketCheckbox.args,
};

export const RocketCheckmarkWithLeadingLabelAndHelper = (args) => {
  return (
    <CheckboxComponent
      {...args}
      type="checkmark"
      label="Remember me"
      helper="Save my login details for next time."
      align="right"
    />
  );
};
RocketCheckmarkWithLeadingLabelAndHelper.args = {
  ...RocketCheckbox.args,
};
