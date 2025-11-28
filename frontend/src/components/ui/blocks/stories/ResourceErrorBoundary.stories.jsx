import React from 'react';
import { ResourceErrorBoundary } from '../ResourceErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('This is a test error!');
  }
  return <div>No error - component rendered successfully</div>;
}

export default {
  title: 'UI/Blocks/ResourceErrorBoundary',
  component: ResourceErrorBoundary,
  parameters: {
    layout: 'centered',
  },
};

export const Default = () => (
  <ResourceErrorBoundary>
    <div className="tw-p-4 tw-border tw-border-border-weak tw-rounded">
      <h3 className="tw-mb-2">Content wrapped in ResourceErrorBoundary</h3>
      <p>This content will be protected from errors.</p>
    </div>
  </ResourceErrorBoundary>
);

export const WithError = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  return (
    <ResourceErrorBoundary>
      <div className="tw-p-4">
        <button onClick={() => setShouldThrow(true)} className="tw-mb-4 tw-px-4 tw-py-2 tw-bg-red-500 tw-text-white tw-rounded">
          Trigger Error
        </button>
        <ThrowError shouldThrow={shouldThrow} />
      </div>
    </ResourceErrorBoundary>
  );
};

