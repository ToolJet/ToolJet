// Loaded asynchronously per edition, so it is undefined until the module has resolved.
declare const posthogHelper:
  { captureEvent: (event: string, properties?: Record<string, unknown>) => void } | undefined;
export default posthogHelper;
