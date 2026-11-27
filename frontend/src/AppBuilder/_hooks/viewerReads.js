import { appEnvironmentService, orgEnvironmentConstantService, dataqueryService } from '@/_services';

// A read started before it is needed: a failure surfaces where it is used, never as an unhandled rejection.
const settle = (promise) =>
  promise.then(
    (value) => ({ value }),
    (error) => ({ error })
  );
const unwrap = async (settled) => {
  const { value, error } = await settled;
  if (error) throw error;
  return value;
};

// The environment, constants and queries a viewer reads after its app definition. With `early` (it already knows the
// environment and version), all three start at once, alongside the definition, instead of one after another after
// it. Each is used only if the definition asks for the same environment or version; otherwise it is read afresh.
export const createViewerReads = ({ early, environmentId, versionId, slug, mode }) => {
  const started = early
    ? {
        environment: settle(appEnvironmentService.getEnvironment(environmentId, { slug })),
        constants: settle(orgEnvironmentConstantService.getConstantsFromEnvironment(environmentId)),
        queries: settle(dataqueryService.getAll(versionId, mode)),
      }
    : null;
  return {
    environment: (id, params) =>
      started && id === environmentId && params?.slug === slug
        ? unwrap(started.environment)
        : appEnvironmentService.getEnvironment(id, params),
    constants: (id) =>
      started && id === environmentId
        ? unwrap(started.constants)
        : orgEnvironmentConstantService.getConstantsFromEnvironment(id),
    queries: (id, readMode) =>
      started && id === versionId && readMode === mode
        ? unwrap(started.queries)
        : dataqueryService.getAll(id, readMode),
  };
};
