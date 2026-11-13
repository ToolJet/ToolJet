import { Command, Flags } from '@oclif/core';
import { spawn } from 'child_process';
import * as os from 'os';
import fetch = require('node-fetch');

import { Auth, keptDefaultNote } from '../../lib/library/auth';
import { ApiClient } from '../../lib/library/api-client';
import { validateOriginUrl } from '../../lib/library/target-validation';
import { deviceLogin } from '../../lib/app/device-login';
import { ensureCompatible } from '../../lib/compatibility';
import { formatError, formatSuccess } from '../../lib/log';

const openInBrowser = (url: string) => {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
  } catch {
    /* the printed address is enough */
  }
};

export default class AuthLogin extends Command {
  static description =
    'Sign in through the browser: approve the code this shows on your ToolJet instance. The token is stored in ~/.tooljet/credentials.json and never printed.';

  static examples = [
    '$ tooljet auth login --url https://tooljet.example.com',
    '$ tooljet auth login --url https://tooljet.example.com --default   # also make it the default login',
  ];

  static flags = {
    url: Flags.string({ description: 'Your ToolJet instance (its API origin)', required: true }),
    browser: Flags.boolean({ description: 'Open the approve page in the browser', default: true, allowNo: true }),
    default: Flags.boolean({
      description:
        'Make this the default login even when another instance is signed in (projects always use their own instance)',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);
    try {
      const valid = validateOriginUrl(flags.url);
      if (valid !== true) throw new Error(valid);
      const origin = new URL(flags.url).origin;
      // Before the browser sign-in, so a mismatch is not found only after approving it.
      await ensureCompatible(origin);
      const result = await deviceLogin({
        url: origin,
        clientName: `tooljet CLI on ${os.hostname().replace(/\.local$/, '')}`,
        fetch: fetch as any,
        onCode: ({ userCode, verificationUri, expiresIn }) => {
          this.log(`Open ${verificationUri} and enter this code:\n\n    ${userCode}\n`);
          this.log(`Waiting for approval (the code works for ${Math.round(expiresIn / 60)} minutes)...`);
          if (flags.browser) openInBrowser(verificationUri);
        },
      });
      // Check the token before keeping it, as `tooljet login` does.
      const me = await new ApiClient(origin, result.token).login();
      const saved = Auth.save(me.organizationId, origin, result.token, me.email, flags.default ? { makeDefault: true } : {});
      this.log(formatSuccess(`Signed in to ${origin} as ${me.email}. Credentials saved to ~/.tooljet/credentials.json`));
      if (!saved.isDefault) this.log(keptDefaultNote(origin, saved.defaultUrl));
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
