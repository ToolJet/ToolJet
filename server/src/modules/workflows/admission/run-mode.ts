/*
 * Whether an app trigger runs synchronously (the request waits for the result) or is queued.
 * The saved query decides, never the request body: otherwise any caller, including an anonymous
 * public-app visitor, could hold a web worker for the whole run by sending syncExecution: true
 * (WF-NEW-01). A saved query that never set the option runs sync, as the App Builder's toggle
 * defaults to. Without a saved query only a signed-in caller may choose; anyone else is queued.
 */
export function triggerRunsSync(input: {
  savedQueryOptions?: { syncExecution?: boolean } | null;
  hasSavedQuery: boolean;
  requestedSync?: boolean;
  signedIn: boolean;
}): boolean {
  if (input.hasSavedQuery) return input.savedQueryOptions?.syncExecution ?? true;
  return input.signedIn ? (input.requestedSync ?? false) : false;
}
