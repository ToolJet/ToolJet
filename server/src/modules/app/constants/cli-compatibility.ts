/*
  What the ToolJet CLI checks before a command uses this server (GET /api/cli-compatibility). The CLI releases
  separately from ToolJet, so each side sets its own floor (cli/src/lib/compatibility.ts):

  - MIN_CLI_VERSION: the oldest CLI release this server works with. Raise it when the server changes or drops
    something an older CLI relies on; that CLI then asks its user to upgrade the CLI.
  - CLI_API_VERSION: a whole number for the routes the CLI uses. Raise it when the server adds or changes something
    a CLI release relies on, and set that CLI's MIN_SERVER_CLI_API to it; an older server then asks its user to
    upgrade ToolJet. A whole number rather than a ToolJet version, so a feature backported to another release line
    brings it along.
*/
export const CLI_API_VERSION = 1;
export const MIN_CLI_VERSION = '0.0.15-beta.2';

export interface CliCompatibility {
  serverVersion: string;
  cliApiVersion: number;
  minCliVersion: string;
}

export const cliCompatibility = (): CliCompatibility => ({
  serverVersion: globalThis.TOOLJET_VERSION || '',
  cliApiVersion: CLI_API_VERSION,
  minCliVersion: MIN_CLI_VERSION,
});
