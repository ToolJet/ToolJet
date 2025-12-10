import React from 'react';
import PropTypes from 'prop-types';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/Rocket/empty';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

export function ErrorState({ title, description, onRetry, error }) {
  const errorMessage = description || error?.message || 'An unknown error occurred.';

  return (
    <Empty role="alert" aria-live="polite" aria-atomic="true">
      <EmptyHeader>
        <EmptyMedia variant="default">
          <AlertCircle className="tw-size-10 tw-text-icon-danger" />
        </EmptyMedia>
        <EmptyTitle>{title || 'Something went wrong'}</EmptyTitle>
        <EmptyDescription id="error-description">{errorMessage}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {onRetry && (
          <Button onClick={onRetry} aria-label="Retry operation">
            Retry
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}

ErrorState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  onRetry: PropTypes.func,
  error: PropTypes.instanceOf(Error),
};
