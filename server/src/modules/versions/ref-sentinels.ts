// Persisted pin values shared by module and workflow ref resolution. These strings live in
// component properties and query options and travel through git — changing one orphans every
// ref holding it. Mirrored in frontend/src/_helpers/versionLabels.js.
export const DRAFT_SENTINEL = '__default_branch_draft__';
export const WORKFLOW_CURRENT_BRANCH_SENTINEL = '__current_branch__';
