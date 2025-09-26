import React from 'react';
import { InlineInfoCompound } from './InlineInfo';
import { Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '../Button/Button';

export default {
  title: 'UI/InlineInfo',
  component: InlineInfoCompound,
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
    title: {
      control: { type: 'text' },
    },
    description: {
      control: { type: 'text' },
    },
  },
};

const Template = (args) => <InlineInfoCompound {...args} />;

export const Default = Template.bind({});
Default.args = {
  type: 'info',
  background: 'none',
  title: 'Information',
  description: 'This is an informational message.',
  icon: Info,
  button: (
    <Button size="small" variant="outline">
      Learn More
    </Button>
  ),
};

// All Variants Grid
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
        <h2 className="tw-text-2xl tw-font-bold tw-mb-4">InlineInfo Compound Component - All Variants</h2>
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
                <InlineInfoCompound
                  type={type}
                  background={background}
                  icon={icons[type]}
                  title={titles[type]}
                  description={descriptions[type]}
                  button={
                    <Button size="sm" variant={type === 'danger' ? 'destructive' : 'outline'}>
                      Action
                    </Button>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Individual Type Stories
export const InfoVariants = () => (
  <div className="tw-space-y-4">
    <h3 className="tw-text-lg tw-font-semibold">Info Type Variants</h3>
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
      {['none', 'grey', 'white', 'state-specific'].map((background) => (
        <div key={background} className="tw-space-y-2">
          <div className="tw-text-sm tw-font-medium tw-text-gray-600 tw-capitalize">
            {background.replace('-', ' ')} Background
          </div>
          <InlineInfoCompound
            type="info"
            background={background}
            icon={Info}
            title="Information"
            description="This is an informational message."
            button={
              <Button size="sm" variant="outline">
                Learn More
              </Button>
            }
          />
        </div>
      ))}
    </div>
  </div>
);

export const WarningVariants = () => (
  <div className="tw-space-y-4">
    <h3 className="tw-text-lg tw-font-semibold">Warning Type Variants</h3>
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
      {['none', 'grey', 'white', 'state-specific'].map((background) => (
        <div key={background} className="tw-space-y-2">
          <div className="tw-text-sm tw-font-medium tw-text-gray-600 tw-capitalize">
            {background.replace('-', ' ')} Background
          </div>
          <InlineInfoCompound
            type="warning"
            background={background}
            icon={AlertTriangle}
            title="Warning"
            description="Please review your settings before proceeding."
            button={
              <Button size="sm" variant="outline">
                Review
              </Button>
            }
          />
        </div>
      ))}
    </div>
  </div>
);

export const DangerVariants = () => (
  <div className="tw-space-y-4">
    <h3 className="tw-text-lg tw-font-semibold">Danger Type Variants</h3>
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
      {['none', 'grey', 'white', 'state-specific'].map((background) => (
        <div key={background} className="tw-space-y-2">
          <div className="tw-text-sm tw-font-medium tw-text-gray-600 tw-capitalize">
            {background.replace('-', ' ')} Background
          </div>
          <InlineInfoCompound
            type="danger"
            background={background}
            icon={AlertCircle}
            title="Error"
            description="Something went wrong. Please try again."
            button={
              <Button size="sm" variant="destructive">
                Retry
              </Button>
            }
          />
        </div>
      ))}
    </div>
  </div>
);

// Interactive Playground
export const Playground = Template.bind({});
Playground.args = {
  type: 'info',
  background: 'none',
  title: 'Custom Title',
  description: 'Custom description text goes here.',
  icon: Info,
  button: (
    <Button size="sm" variant="outline">
      Custom Button
    </Button>
  ),
};
