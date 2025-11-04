// Simple policy helpers. Expand as roles/ownership rules emerge.

export function deriveAppPermissions({ user, app }) {
  // Placeholder always-true perms for now.
  return {
    canImport: true,
    canEdit: true,
    canPlay: true,
  };
}


