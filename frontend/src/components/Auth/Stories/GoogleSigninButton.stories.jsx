import * as React from 'react';
import { GoogleSigninButton } from '../GoogleSigninButton';

export default {
  title: 'Auth/GoogleSigninButton',
  component: GoogleSigninButton,
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
const Template = (args) => <GoogleSigninButton {...args} />;

// Default story
export const Default = Template.bind({});
Default.args = {
  text: 'Continue with Google',
  dataCy: 'google-signin-button',
};

// Custom text story
export const CustomText = Template.bind({});
CustomText.args = {
  text: 'Sign in with Google',
  dataCy: 'google-signin-custom',
};

// Short text story
export const ShortText = Template.bind({});
ShortText.args = {
  text: 'Google',
  dataCy: 'google-signin-short',
};

// Long text story
export const LongText = Template.bind({});
LongText.args = {
  text: 'Continue with your Google account',
  dataCy: 'google-signin-long',
};

// Without data-cy story
export const WithoutDataCy = Template.bind({});
WithoutDataCy.args = {
  text: 'Continue with Google',
};
