import { Command } from '@oclif/core';

import { isServerMode } from '../../lib/server-mode';

/** The MCP server's check that this CLI honours server mode before it trusts a build (lib/server-mode.ts). */
export default class AppServerMode extends Command {
  static description = 'Report whether this CLI is running in server mode';

  static hidden = true;

  async run(): Promise<void> {
    this.log(isServerMode() ? 'tooljet-server-mode:1' : 'tooljet-server-mode:0');
  }
}
