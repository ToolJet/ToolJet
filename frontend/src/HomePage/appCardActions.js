const TYPES_WITHOUT_PREVIEW = new Set(['module', 'workflow']);

export const canShowPreviewButton = ({ appType, canUpdate, canView, hasNonReleasedPreviewAccess }) =>
  !canUpdate && canView && !TYPES_WITHOUT_PREVIEW.has(appType) && !!hasNonReleasedPreviewAccess;
