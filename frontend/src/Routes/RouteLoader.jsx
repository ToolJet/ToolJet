import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import React from 'react';

export const RouteLoader = ({ children, isLoading }) => {
  if (isLoading) return <TJLoader />;
  return <>{children}</>;
};
