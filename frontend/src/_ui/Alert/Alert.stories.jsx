import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alert/Alert';
import { Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

// Storybook configuration
export default {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Alert component for displaying important messages to users with various types and background variants.',
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['info', 'warning', 'danger'],
      description: 'The type of alert',
    },
    background: {
      control: { type: 'select' },
      options: ['none', 'grey', 'white', 'state-specific'],
      description: 'The background variant of the alert',
    },
    children: {
      control: 'text',
      description: 'The message content to display in the alert',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the alert container',
    },
  },
};

// Template for stories
const Template = (args) => <Alert {...args} />;

// Default alert
export const Default = Template.bind({});
Default.args = {
  type: 'info',
  background: 'none',
  children: (
    <>
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is a default alert message.</AlertDescription>
      </div>
    </>
  ),
};

// Alert variants with different types
export const InfoAlert = Template.bind({});
InfoAlert.args = {
  type: 'info',
  background: 'none',
  children: (
    <>
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>This is an informational alert message.</AlertDescription>
      </div>
    </>
  ),
};

export const Warning = Template.bind({});
Warning.args = {
  type: 'warning',
  background: 'none',
  children: (
    <>
      <AlertTriangle className="tw-w-4 tw-h-4 tw-text-icon-warning" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This is a warning alert message.</AlertDescription>
      </div>
    </>
  ),
};

export const Danger = Template.bind({});
Danger.args = {
  type: 'danger',
  background: 'none',
  children: (
    <>
      <AlertCircle className="tw-w-4 tw-h-4 tw-text-icon-danger" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>This is an error alert message.</AlertDescription>
      </div>
    </>
  ),
};

// Background variants
export const GreyBackground = Template.bind({});
GreyBackground.args = {
  type: 'info',
  background: 'grey',
  children: (
    <>
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Grey Background</AlertTitle>
        <AlertDescription>This alert has a grey background.</AlertDescription>
      </div>
    </>
  ),
};

export const WhiteBackground = Template.bind({});
WhiteBackground.args = {
  type: 'info',
  background: 'white',
  children: (
    <>
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>White Background</AlertTitle>
        <AlertDescription>This alert has a white background with shadow.</AlertDescription>
      </div>
    </>
  ),
};

export const StateSpecificBackground = Template.bind({});
StateSpecificBackground.args = {
  type: 'info',
  background: 'state-specific',
  children: (
    <>
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>State Specific Background</AlertTitle>
        <AlertDescription>This alert has a state-specific colored background.</AlertDescription>
      </div>
    </>
  ),
};

// Long message variant
export const LongMessage = Template.bind({});
LongMessage.args = {
  type: 'warning',
  background: 'white',
  children: (
    <>
      <AlertTriangle className="tw-w-4 tw-h-4 tw-text-icon-warning" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Long Message Alert</AlertTitle>
        <AlertDescription>
          This is a very long alert message that demonstrates how the alert component handles text wrapping and
          overflow. The message should wrap properly and maintain good readability even with extended content that spans
          multiple lines.
        </AlertDescription>
      </div>
    </>
  ),
};

// No icon variant
export const NoIcon = Template.bind({});
NoIcon.args = {
  type: 'info',
  background: 'none',
  children: (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <AlertTitle>No Icon Alert</AlertTitle>
      <AlertDescription>This alert has no icon.</AlertDescription>
    </div>
  ),
};

// All variants showcase
export const AllVariants = () => {
  const types = ['info', 'warning', 'danger'];
  const backgrounds = ['none', 'grey', 'white', 'state-specific'];
  const icons = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertCircle,
  };
  const titles = {
    info: 'Information',
    warning: 'Warning',
    danger: 'Error',
  };
  const descriptions = {
    info: 'This is an informational message.',
    warning: 'Please review your settings before proceeding.',
    danger: 'Something went wrong. Please try again.',
  };

  return (
    <div className="tw-space-y-8">
      <div>
        <h2 className="tw-text-2xl tw-font-bold tw-mb-4">Alert Component - All Variants</h2>
        <p className="tw-text-gray-600 tw-mb-6">Showcasing all 12 variants (3 types × 4 backgrounds)</p>
      </div>

      {types.map((type) => (
        <div key={type} className="tw-space-y-4">
          <h3 className="tw-text-lg tw-font-semibold tw-capitalize tw-text-gray-800">{type} Type</h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
            {backgrounds.map((background) => {
              const Icon = icons[type];
              return (
                <div key={`${type}-${background}`} className="tw-space-y-2">
                  <div className="tw-text-sm tw-font-medium tw-text-gray-600 tw-capitalize">
                    {background.replace('-', ' ')} Background
                  </div>
                  <Alert type={type} background={background}>
                    <Icon className="tw-w-4 tw-h-4" />
                    <div className="tw-flex tw-flex-col tw-gap-2">
                      <AlertTitle>{titles[type]}</AlertTitle>
                      <AlertDescription>{descriptions[type]}</AlertDescription>
                    </div>
                  </Alert>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// Background variants showcase
export const BackgroundVariants = () => (
  <div className="tw-space-y-4">
    <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Background Variants</h3>

    <Alert type="info" background="none">
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>No Background</AlertTitle>
        <AlertDescription>Alert with no background</AlertDescription>
      </div>
    </Alert>

    <Alert type="info" background="grey">
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Grey Background</AlertTitle>
        <AlertDescription>Alert with grey background</AlertDescription>
      </div>
    </Alert>

    <Alert type="info" background="white">
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>White Background</AlertTitle>
        <AlertDescription>Alert with white background and shadow</AlertDescription>
      </div>
    </Alert>

    <Alert type="info" background="state-specific">
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>State Specific Background</AlertTitle>
        <AlertDescription>Alert with state-specific colored background</AlertDescription>
      </div>
    </Alert>
  </div>
);

// Type variants showcase
export const TypeVariants = () => (
  <div className="tw-space-y-4">
    <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Type Variants</h3>

    <Alert type="info" background="state-specific">
      <Info className="tw-w-4 tw-h-4 tw-text-icon-brand" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>This is an informational alert with blue accent</AlertDescription>
      </div>
    </Alert>

    <Alert type="warning" background="state-specific">
      <AlertTriangle className="tw-w-4 tw-h-4 tw-text-icon-warning" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This is a warning alert with orange accent</AlertDescription>
      </div>
    </Alert>

    <Alert type="danger" background="state-specific">
      <AlertCircle className="tw-w-4 tw-h-4 tw-text-icon-danger" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>This is an error alert with red accent</AlertDescription>
      </div>
    </Alert>
  </div>
);
