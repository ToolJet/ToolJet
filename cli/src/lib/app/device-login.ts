/*
  `tooljet auth login`: sign in through the browser instead of pasting a token.

  The CLI asks the instance for a sign-in request and shows its short code. The user opens the instance's approve
  page (signed in there), types the code and approves; the server then mints a personal access token and hands it to
  the CLI's next poll, once. The address the CLI prints and opens carries no code and no token, and the token is
  never printed: it goes straight to ~/.tooljet/credentials.json.
*/

export interface DeviceStart {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface DeviceLoginResult {
  token: string;
  email: string;
  organizationId: string;
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<any>;
  text: () => Promise<string>;
}>;

export interface DeviceLoginOptions {
  /** The instance's API origin, e.g. https://tooljet.example.com */
  url: string;
  clientName: string;
  fetch: FetchLike;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** Called once with what the user must see: the code and the page to type it in. */
  onCode: (start: DeviceStart) => void | Promise<void>;
}

const post = async (fetch: FetchLike, url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** An absolute approve-page address with nothing in it but the origin and path. */
export const approvePage = (verificationUri: string, apiOrigin: string): string => {
  const page = new URL(verificationUri, apiOrigin);
  return `${page.origin}${page.pathname}`;
};

/**
 * How to open the approve page in the browser, or undefined to leave it to the printed address. The address comes from
 * the server, so it never goes through a shell: on Windows `cmd /c start` would run a command written after an `&` in
 * it, so rundll32 hands it to the default browser instead. Only http and https addresses open.
 */
export function browserCommand(
  url: string,
  platform: NodeJS.Platform
): { command: string; args: string[] } | undefined {
  let page: URL;
  try {
    page = new URL(url);
  } catch {
    return undefined;
  }
  if (page.protocol !== 'http:' && page.protocol !== 'https:') return undefined;
  if (platform === 'win32') return { command: 'rundll32', args: ['url.dll,FileProtocolHandler', page.href] };
  return { command: platform === 'darwin' ? 'open' : 'xdg-open', args: [page.href] };
}

export async function deviceLogin(options: DeviceLoginOptions): Promise<DeviceLoginResult> {
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const now = options.now ?? Date.now;
  const base = `${options.url.replace(/\/+$/, '')}/api/personal-access-tokens/device`;
  const res = await post(options.fetch, base, { clientName: options.clientName });
  if (!res.ok) {
    if (res.status === 404)
      throw new Error(
        'This ToolJet instance does not support browser sign-in yet: use tooljet login with a personal access token.'
      );
    throw new Error(`Could not start the sign-in (HTTP ${res.status}).`);
  }
  const start = (await res.json()) as DeviceStart;
  await options.onCode({ ...start, verificationUri: approvePage(start.verificationUri, options.url) });
  const deadline = now() + start.expiresIn * 1000;
  let interval = Math.max(1, start.interval) * 1000;
  while (now() < deadline) {
    await sleep(interval);
    const poll = await post(options.fetch, `${base}/token`, { deviceCode: start.deviceCode });
    if (poll.status === 404) throw new Error('The sign-in request is gone; run tooljet auth login again.');
    if (!poll.ok) throw new Error(`Sign-in check failed (HTTP ${poll.status}).`);
    const result = await poll.json();
    if (result.status === 'approved')
      return { token: result.token, email: result.email, organizationId: result.organizationId };
    if (result.status === 'expired') break;
    if (result.status === 'slow_down') interval += 2000;
  }
  throw new Error('The code expired before it was approved; run tooljet auth login again.');
}
