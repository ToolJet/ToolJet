// Session flags for personal access tokens. Admins and super admins always pass;
// end-users can never hold the flags (enforced server-side).
export const canCreatePat = (session) =>
  !!(session?.admin || session?.super_admin || session?.user_permissions?.pat_create);

export const canAccessPatPage = (session) => canCreatePat(session) || !!session?.user_permissions?.pat_revoke;

// Revokers see and revoke every token in the workspace; everyone else only their own.
export const canRevokeAnyPat = (session) =>
  !!(session?.admin || session?.super_admin || session?.user_permissions?.pat_revoke);
