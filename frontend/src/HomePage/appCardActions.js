const TYPES_WITHOUT_PREVIEW = new Set(['module', 'workflow']);

export const canShowPreviewButton = ({ appType, canUpdate, canView, hasNonReleasedPreviewAccess }) =>
  !canUpdate && canView && !TYPES_WITHOUT_PREVIEW.has(appType) && !!hasNonReleasedPreviewAccess;

// How an app was built (React builder or Visual builder) is a building detail: end users only open released apps.
export const canShowBuildModeTag = ({ role }) => role?.name !== 'end-user';
