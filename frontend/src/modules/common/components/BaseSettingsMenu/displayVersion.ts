// The version as the settings menu shows it: the installed version without its "-beta" part ("4.0.0-beta-ee" reads
// "4.0.0-ee"). Display only: the update check and the Cloud check read the full installed_version.
export const displayVersion = (version: string | null | undefined): string | null | undefined =>
  version?.replace(/-beta(?=-|$)/i, '') ?? version;
