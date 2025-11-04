import React from 'react';
import { PageContainer } from './PageContainer';

// Mock pagination component for footer
const MockPagination = () => (
  <div className="tw-flex tw-items-center tw-justify-between tw-h-12 tw-px-4">
    <div className="tw-flex tw-items-center tw-gap-2">
      <span className="tw-text-sm tw-text-text-placeholder">Showing</span>
      <select className="tw-border tw-border-border-default tw-rounded tw-px-2 tw-py-1 tw-text-sm">
        <option>50</option>
        <option>100</option>
      </select>
      <span className="tw-text-sm tw-text-text-placeholder">of 100 apps</span>
    </div>
    <div className="tw-flex tw-items-center tw-gap-2">
      <button
        type="button"
        className="tw-px-3 tw-py-1 tw-text-sm tw-border tw-border-border-default tw-rounded tw-bg-background-surface-layer-01"
      >
        Previous
      </button>
      <button
        type="button"
        className="tw-px-3 tw-py-1 tw-text-sm tw-border tw-border-border-default tw-rounded tw-bg-background-surface-layer-01"
      >
        1
      </button>
      <button
        type="button"
        className="tw-px-3 tw-py-1 tw-text-sm tw-border tw-border-border-accent-strong tw-rounded tw-bg-background-accent-weak"
      >
        2
      </button>
      <button
        type="button"
        className="tw-px-3 tw-py-1 tw-text-sm tw-border tw-border-border-default tw-rounded tw-bg-background-surface-layer-01"
      >
        3
      </button>
      <button
        type="button"
        className="tw-px-3 tw-py-1 tw-text-sm tw-border tw-border-border-default tw-rounded tw-bg-background-surface-layer-01"
      >
        Next
      </button>
    </div>
  </div>
);

// Mock content for different scenarios
const MockContent = ({ title, itemCount = 10 }) => (
  <div className="tw-space-y-4">
    <h1 className="tw-text-2xl tw-font-semibold tw-text-text-default">{title}</h1>
    <div className="tw-grid tw-gap-4">
      {Array.from({ length: itemCount }, (_, i) => (
        <div
          key={`item-${i + 1}`}
          className="tw-p-4 tw-border tw-border-border-weak tw-rounded-lg tw-bg-background-surface-layer-01"
        >
          <h3 className="tw-font-medium tw-text-text-default">Item {i + 1}</h3>
          <p className="tw-text-sm tw-text-text-placeholder">
            This is a sample content item to demonstrate the PageContainer layout.
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default {
  title: 'AppsPage/PageContainer',
  component: PageContainer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    children: {
      control: false,
      description: 'Main content to display',
    },
    footer: {
      control: false,
      description: 'Optional sticky footer content',
    },
  },
};

const Template = (args) => <PageContainer {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: <MockContent title="Default PageContainer" />,
};

export const WithFooter = Template.bind({});
WithFooter.args = {
  children: <MockContent title="PageContainer with Pagination Footer" />,
  footer: <MockPagination />,
};

export const LongContent = Template.bind({});
LongContent.args = {
  children: <MockContent title="Long Content with Footer" itemCount={20} />,
  footer: <MockPagination />,
};

export const WithoutFooter = Template.bind({});
WithoutFooter.args = {
  children: <MockContent title="PageContainer without Footer" itemCount={15} />,
};

export const CustomStyling = Template.bind({});
CustomStyling.args = {
  children: <MockContent title="Custom Styled PageContainer" />,
  footer: <MockPagination />,
  className: 'tw-bg-page-weak',
};

// Interactive example showing different states
export const Interactive = () => {
  const [showFooter, setShowFooter] = React.useState(true);
  const [contentLength, setContentLength] = React.useState(8);

  return (
    <div className="tw-space-y-4 tw-p-4">
      <div className="tw-flex tw-gap-4 tw-items-center">
        <label className="tw-flex tw-items-center tw-gap-2">
          <input type="checkbox" checked={showFooter} onChange={(e) => setShowFooter(e.target.checked)} />
          Show Footer
        </label>
        <label className="tw-flex tw-items-center tw-gap-2">
          Content Items:
          <select
            value={contentLength}
            onChange={(e) => setContentLength(Number(e.target.value))}
            className="tw-border tw-border-border-default tw-rounded tw-px-2"
          >
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
          </select>
        </label>
      </div>
      <div className="tw-h-96 tw-border tw-border-border-weak tw-rounded">
        <PageContainer footer={showFooter ? <MockPagination /> : null} className="tw-h-full">
          <MockContent title="Interactive PageContainer" itemCount={contentLength} />
        </PageContainer>
      </div>
    </div>
  );
};
Interactive.parameters = {
  docs: {
    description: {
      story: 'Interactive example showing different PageContainer states with controls.',
    },
  },
};
