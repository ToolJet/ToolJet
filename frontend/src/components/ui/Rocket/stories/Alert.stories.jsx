import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '../alert';
import { Info, AlertTriangle, AlertCircle } from 'lucide-react';

export default {
  title: 'UI/Rocket/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['info', 'warning', 'danger'],
    },
    background: {
      control: { type: 'select' },
      options: ['none', 'grey', 'white', 'state-specific'],
    },
  },
};

const Template = (args) => (
  <Alert {...args}>
    <AlertTitle>Alert Title</AlertTitle>
    <AlertDescription>This is an alert description.</AlertDescription>
  </Alert>
);

export const Default = Template.bind({});
Default.args = {
  type: 'info',
  background: 'none',
};

export const AllVariants = () => {
  const types = ['info', 'warning', 'danger'];
  const backgrounds = ['none', 'grey', 'white', 'state-specific'];
  const icons = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertCircle,
  };

  return (
    <div className="tw-space-y-8">
      <div>
        <h2 className="tw-text-2xl tw-font-bold tw-mb-4">Alert Component - All Variants</h2>
        <p className="tw-text-gray-600 tw-mb-6">
          Showcasing all 12 variants from Figma design (3 types × 4 backgrounds)
        </p>
      </div>

      {types.map((type) => (
        <div key={type} className="tw-space-y-4">
          <h3 className="tw-text-lg tw-font-semibold tw-capitalize tw-text-gray-800">{type} Type</h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
            {backgrounds.map((background) => (
              <div key={`${type}-${background}`} className="tw-space-y-2">
                <div className="tw-text-sm tw-font-medium tw-text-gray-600 tw-capitalize">
                  {background.replace('-', ' ')} Background
                </div>
                <Alert type={type} background={background}>
                  <div className="tw-flex tw-gap-1.5 tw-items-start">
                    {React.createElement(icons[type], {
                      className: 'tw-w-[18px] tw-h-[18px] tw-shrink-0',
                    })}
                    <div className="tw-flex tw-flex-col tw-gap-2">
                      <AlertTitle>Alert Title</AlertTitle>
                      <AlertDescription>This is an alert description.</AlertDescription>
                    </div>
                  </div>
                </Alert>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const WithIcon = () => (
  <div className="tw-space-y-4">
    <Alert type="info" background="none">
      <Info className="tw-w-[18px] tw-h-[18px] tw-shrink-0" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>This is an informational alert.</AlertDescription>
      </div>
    </Alert>
    <Alert type="warning" background="grey">
      <AlertTriangle className="tw-w-[18px] tw-h-[18px] tw-shrink-0" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please review your settings.</AlertDescription>
      </div>
    </Alert>
    <Alert type="danger" background="state-specific">
      <AlertCircle className="tw-w-[18px] tw-h-[18px] tw-shrink-0" />
      <div className="tw-flex tw-flex-col tw-gap-2">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </div>
    </Alert>
  </div>
);
