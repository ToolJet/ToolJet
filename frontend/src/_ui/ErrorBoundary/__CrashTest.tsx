// TEMPORARY dev-only scaffolding to exercise FallbackBoundary fallbacks.
// Drop <CrashTest /> as the first child of any FallbackBoundary to trip it.
// Remove all usages + this file before merging.
const CrashTest = ({ message = 'Deliberate test crash' }: { message?: string }): never => {
  throw new Error(message);
};

export default CrashTest;
