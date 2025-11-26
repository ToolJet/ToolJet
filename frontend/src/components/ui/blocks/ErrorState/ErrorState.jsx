import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/Button/Button';

export function ErrorState({ title, description, onRetry, error }) {
  const errorMessage = description || error?.message || 'An unknown error occurred.';

  return (
    <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite" aria-atomic="true">
      <div className="tw-text-red-500 tw-font-semibold tw-mb-2" aria-label="Error message">
        {title || 'Something went wrong'}
      </div>
      <div className="tw-text-sm tw-text-muted-foreground" id="error-description">
        {errorMessage}
      </div>
      {onRetry && (
        <Button onClick={onRetry} className="tw-mt-4" aria-label="Retry operation">
          Retry
        </Button>
      )}
    </div>
  );
}

ErrorState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  onRetry: PropTypes.func,
  error: PropTypes.instanceOf(Error),
};
