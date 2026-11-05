import { FEATURE_KEY as LIBRARY_FEATURE } from '@modules/custom-component-libraries/constants';
import { heldByAnotherApp, libraryClaims } from '@modules/custom-component-libraries/library-ownership';

/*
  What the in-product AI builder's session (tj_api_source ai_builder) may do on the library routes: publish the
  library of the one app the AI request is for (the aiAppId claim), in the session's own workspace.
  A library counts as that app's when no other app in the workspace holds it (a new library is nobody's yet): see
  libraryUsedByAnotherApp.
*/

export type ScopeQuery = (sql: string, params: unknown[]) => Promise<Array<Record<string, any>>>;

export interface AiBuilderScopeRequest {
  organizationId?: string;
  aiAppId?: string;
  /** The tj-workspace-id header, when sent. */
  workspaceHeader?: string;
  /** From the body (find-or-create) or the route (:correlationId). */
  correlationId?: string;
}

const PER_LIBRARY: string[] = [
  LIBRARY_FEATURE.FIND_OR_CREATE_LIBRARY,
  LIBRARY_FEATURE.GET_LIBRARY,
  LIBRARY_FEATURE.UPLOAD_DEV_BUNDLE,
  LIBRARY_FEATURE.PUBLISH_REVISION,
];
const WORKSPACE_READS: string[] = [LIBRARY_FEATURE.LIST_LIBRARIES];

/** The refusal message, or undefined when the call is allowed. */
export async function aiBuilderLibraryDenial(
  feature: string | undefined,
  req: AiBuilderScopeRequest,
  query: ScopeQuery
): Promise<string | undefined> {
  const { organizationId, aiAppId, workspaceHeader, correlationId } = req;
  if (!feature || (!PER_LIBRARY.includes(feature) && !WORKSPACE_READS.includes(feature))) {
    return `The AI builder session cannot use ${feature ?? 'this library route'}.`;
  }
  if (!organizationId || !aiAppId) return 'This AI builder session is not tied to an app.';
  if (workspaceHeader && workspaceHeader !== organizationId) {
    return 'This AI builder session can only act on its own workspace.';
  }
  const [app] = await query('SELECT organization_id FROM apps WHERE id = $1', [aiAppId]);
  if (!app || app.organization_id !== organizationId) return 'The app of this AI request is not in this workspace.';
  if (WORKSPACE_READS.includes(feature)) return undefined;
  if (!correlationId) return 'Name the library (correlationId).';
  if (await libraryUsedByAnotherApp(organizationId, aiAppId, correlationId, query)) {
    return 'This AI builder session can only publish the library of the app it is building.';
  }
  return undefined;
}

/**
 * Whether the library is another app's, by the one ownership model (custom-component-libraries/library-ownership.ts):
 * owned by another app's stored code, or, while no app owns it, named by another app's components or pins. A library
 * no other app holds counts as `appId`'s own; a new library is nobody's yet. Shared by the AI builder's session above
 * and by code-mode-source, which publishes an app's code into its library.
 */
export async function libraryUsedByAnotherApp(
  organizationId: string,
  appId: string,
  correlationId: string,
  query: ScopeQuery
): Promise<boolean> {
  return heldByAnotherApp(await libraryClaims(organizationId, correlationId, query), appId);
}
