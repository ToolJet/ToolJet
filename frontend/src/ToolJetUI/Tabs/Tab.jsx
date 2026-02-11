import React from 'react';

// Simple Tab component - just a props container
// Actual rendering is handled by Tabs parent component
const Tab = ({ eventKey, title, children, disabled = false, className, ...restProps }) => {
  // This component doesn't render anything directly
  // It's used by Tabs to extract eventKey, title, and children
  return null;
};

export default Tab;
