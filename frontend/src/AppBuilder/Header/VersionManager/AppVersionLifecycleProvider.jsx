import React from 'react';
import { VersionLifecycleProvider, useOptionalVersionLifecycle } from './VersionLifecycleContext';
import { useAppVersionLifecycle } from './useAppVersionLifecycle';

export function AppVersionLifecycleProvider({ children, ...options }) {
  const value = useAppVersionLifecycle(options);
  return <VersionLifecycleProvider value={value}>{children}</VersionLifecycleProvider>;
}

// A separate component boundary ensures explicit providers never execute the app hook.
export function withAppVersionLifecycle(Content, options = {}) {
  const LifecycleComponent = (props) => {
    const value = useOptionalVersionLifecycle();
    if (value) return <Content {...props} />;
    return (
      <AppVersionLifecycleProvider {...options} {...props}>
        <Content {...props} />
      </AppVersionLifecycleProvider>
    );
  };
  return LifecycleComponent;
}
