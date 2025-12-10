import React from 'react';
import { ErrorState } from '../ErrorState';

export default {
  title: 'UI/Blocks/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'centered',
  },
};

export const Default = () => <ErrorState title="Something went wrong" />;

export const WithDescription = () => (
  <ErrorState
    title="Failed to load data"
    description="Unable to connect to the server. Please check your internet connection."
  />
);

export const WithRetry = () => (
  <ErrorState
    title="Failed to load apps"
    description="An error occurred while fetching applications."
    onRetry={() => alert('Retrying...')}
  />
);

export const WithErrorObject = () => (
  <ErrorState
    title="Application Error"
    error={new Error('Network timeout after 30 seconds')}
    onRetry={() => alert('Retrying...')}
  />
);

export const WithoutRetry = () => (
  <ErrorState title="Access Denied" description="You do not have permission to view this resource." />
);

export const CustomMessage = () => (
  <ErrorState title="Custom Error" description="This is a custom error message for demonstration purposes." />
);
