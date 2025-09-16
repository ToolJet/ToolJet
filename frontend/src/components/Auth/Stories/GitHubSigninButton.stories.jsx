import React from 'react';
import { GitHubSigninButton } from '../GitHubSigninButton';

export default {
  title: 'Auth/GitHubSigninButton',
  component: GitHubSigninButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: {
      action: 'clicked',
      description: 'Function called when the button is clicked',
    },
    text: {
      control: 'text',
      description: 'Text displayed on the button',
    },
    dataCy: {
      control: 'text',
      description: 'Data-cy attribute for testing',
    },
  },
};

// Template for creating stories
const Template = (args) => <GitHubSigninButton {...args} />;

// Default story
export const Default = Template.bind({});
Default.args = {
  text: 'Continue with GitHub',
  dataCy: 'github-signin-button',
};

// Custom text story
export const CustomText = Template.bind({});
CustomText.args = {
  text: 'Sign in with GitHub',
  dataCy: 'github-signin-custom',
};

// Short text story
export const ShortText = Template.bind({});
ShortText.args = {
  text: 'GitHub',
  dataCy: 'github-signin-short',
};

// Long text story
export const LongText = Template.bind({});
LongText.args = {
  text: 'Continue with your GitHub account',
  dataCy: 'github-signin-long',
};

// Without data-cy story
export const WithoutDataCy = Template.bind({});
WithoutDataCy.args = {
  text: 'Continue with GitHub',
};
