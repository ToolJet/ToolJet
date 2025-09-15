import React from 'react';
import PasswordInput from '../PasswordInput';

export default {
  title: 'Auth/PasswordInput',
  component: PasswordInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the password input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input field',
    },
    value: {
      control: 'text',
      description: 'Current value of the password input',
    },
    onChange: {
      action: 'changed',
      description: 'Callback function when input value changes',
    },
    error: {
      control: 'text',
      description: 'Error message to display below the input',
    },
    name: {
      control: 'text',
      description: 'Name attribute for the input field',
    },
    dataCy: {
      control: 'text',
      description: 'Data-cy attribute for testing',
    },
    minLength: {
      control: 'number',
      description: 'Minimum length requirement for the password',
    },
    hint: {
      control: 'text',
      description: 'Hint text to display below the input',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    showForgotPassword: {
      control: 'boolean',
      description: 'Whether to show the forgot password link',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

const Template = (args) => <PasswordInput {...args} />;

export const Default = Template.bind({});
Default.args = {
  label: 'Password',
  placeholder: 'Enter your password',
  value: '',
  name: 'password',
  dataCy: 'password',
  minLength: 8,
  hint: 'Password must be at least 8 characters',
  disabled: false,
  showForgotPassword: false,
};

export const WithForgotPassword = Template.bind({});
WithForgotPassword.args = {
  ...Default.args,
  showForgotPassword: true,
};

export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  value: '123',
  error: 'Password must be at least 8 characters long',
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  value: 'mypassword123',
  disabled: true,
};

export const CustomHint = Template.bind({});
CustomHint.args = {
  ...Default.args,
  hint: 'Use a strong password with letters, numbers, and symbols',
};

export const CustomLabel = Template.bind({});
CustomLabel.args = {
  ...Default.args,
  label: 'New Password',
  placeholder: 'Create a new password',
  hint: 'Choose a secure password for your account',
};

export const WithValue = Template.bind({});
WithValue.args = {
  ...Default.args,
  value: 'mySecurePassword123!',
};

export const ShortPassword = Template.bind({});
ShortPassword.args = {
  ...Default.args,
  minLength: 12,
  hint: 'Password must be at least 12 characters',
  value: 'short',
  error: 'Password is too short',
};

export const LoginFormStyle = Template.bind({});
LoginFormStyle.args = {
  ...Default.args,
  label: 'Password',
  placeholder: 'Enter your password',
  showForgotPassword: true,
  hint: 'Enter your account password',
};

export const SignupFormStyle = Template.bind({});
SignupFormStyle.args = {
  ...Default.args,
  label: 'Create Password',
  placeholder: 'Create a strong password',
  hint: 'Password must be at least 8 characters with letters and numbers',
};



