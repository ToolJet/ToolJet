// TEMP: throw-on-render component used to exercise FallbackBoundary in each panel.
// Drop <CrashTest message="..." /> inside a boundary to verify isolation + fallback.
// DELETE THIS FILE and its usages before committing.
const CrashTest = ({ message = 'Deliberate test crash' }: { message?: string }): never => {
  throw new Error(message);
};

export default CrashTest;
