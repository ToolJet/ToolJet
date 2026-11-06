import fetch = require('node-fetch');

import { Auth } from '../library/auth';
import { validateOriginUrl } from '../library/target-validation';

/*
  How `tooljet app` reaches a ToolJet instance. The target is, in order: --url and --token, then TOOLJET_URL and
  TOOLJET_PAT (or TOOLJET_TOKEN) from the environment, then the stored `tooljet login`. The personal access token is
  exchanged for a session (POST /api/personal-access-tokens/session), which every app, page and query route accepts,
  and whose JWT names the user (its email, and its user id, by which the dev track keys each user's bundle: see remote.ts).
*/

export interface Target {
  url: string;
  token: string;
  /** 'session': `token` is already a ToolJet session (TOOLJET_SESSION_TOKEN, an in-product build), not a PAT. */
  kind?: 'pat' | 'session';
  workspaceId?: string;
}

export interface Session extends Target {
  organizationId: string;
  organizationSlug?: string;
  /** The signed-in user's email (the session token's subject). */
  email: string;
  /** The signed-in user's id (the session token's `username`); empty when the token does not carry it. */
  userId: string;
  /** fetch against the API with the session cookie and workspace header. */
  api: (path: string, init?: { method?: string; body?: unknown }) => Promise<any>;
}

export const resolveTarget = (flags: { url?: string; token?: string } = {}): Target => {
  const url = flags.url ?? process.env.TOOLJET_URL;
  // An in-product build's MCP server runs as the signed-in user with a session, not a personal access token.
  const sessionToken = process.env.TOOLJET_SESSION_TOKEN;
  if (!flags.token && !process.env.TOOLJET_PAT && sessionToken && url) {
    const workspaceId = process.env.TOOLJET_WORKSPACE_ID;
    if (!workspaceId) throw new Error('TOOLJET_SESSION_TOKEN needs TOOLJET_WORKSPACE_ID beside it.');
    const urlError = validateOriginUrl(url);
    if (urlError !== true) throw new Error(urlError);
    return { url: url.replace(/\/+$/, ''), token: sessionToken, kind: 'session', workspaceId };
  }
  const token = flags.token ?? process.env.TOOLJET_PAT ?? process.env.TOOLJET_TOKEN;
  if (url || token) {
    if (!url || !token) throw new Error('Give both a URL and a token (--url and --token, or TOOLJET_URL and TOOLJET_PAT).');
    const urlError = validateOriginUrl(url);
    if (urlError !== true) throw new Error(urlError);
    return { url: url.replace(/\/+$/, ''), token };
  }
  const stored = Auth.resolve();
  return { url: stored.url.replace(/\/+$/, ''), token: stored.apiToken };
};

/** The server this command would talk to, for what does not need a session; undefined when not signed in anywhere. */
export const signedInServer = (flags: { url?: string; token?: string } = {}): string | undefined => {
  try {
    return resolveTarget(flags).url;
  } catch {
    return undefined;
  }
};

const jwtPayload = (jwt: string): Record<string, unknown> => {
  try {
    return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')) ?? {};
  } catch {
    return {};
  }
};
const jwtSubject = (jwt: string): string => {
  const payload = jwtPayload(jwt);
  return String(payload.sub ?? payload.userId ?? payload.id ?? '');
};
const jwtUserId = (jwt: string): string => String(jwtPayload(jwt).username ?? '');

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly body: string) {
    super(message);
  }
}

const sessionApi = (url: string, token: string, workspaceId: string) => async (path: string, init: { method?: string; body?: unknown } = {}) => {
  const response = await fetch(`${url}/api${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Cookie: `tj_auth_token=${token}`,
      'tj-workspace-id': workspaceId,
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      /* not JSON */
    }
    throw new ApiError(`${init.method ?? 'GET'} ${path} failed (HTTP ${response.status}) on ${url}: ${String(message).slice(0, 300)}`, response.status, text);
  }
  return text ? JSON.parse(text) : null;
};

/** TOOLJET_URL beats the login, which is easy to forget when the server it names is the one that fails. */
const envOverrideNote = (url: string): string =>
  process.env.TOOLJET_URL?.replace(/\/+$/, '') === url
    ? ' TOOLJET_URL is set in your environment and overrides tooljet auth login; unset it to use your login.'
    : '';

export async function openSession(target: Target): Promise<Session> {
  if (target.kind === 'session' && target.workspaceId) {
    // Already a session: no exchange, and the user is the token's subject.
    return {
      ...target,
      organizationId: target.workspaceId,
      email: jwtSubject(target.token),
      userId: jwtUserId(target.token),
      api: sessionApi(target.url, target.token, target.workspaceId),
    };
  }
  const res = await fetch(`${target.url}/api/personal-access-tokens/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${target.token}` },
  }).catch((err: Error) => {
    throw new Error(`Could not reach ToolJet at ${target.url}: ${err.message}.${envOverrideNote(target.url)}`);
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(
      res.status === 401
        ? `The ToolJet token was rejected by ${target.url}: it may have expired (a sign-in lasts 30 days), so run tooljet auth login again, or check it is a current personal access token for this instance.${envOverrideNote(target.url)}`
        : `Could not open a ToolJet session on ${target.url} (HTTP ${res.status}).${envOverrideNote(target.url)}`,
      res.status,
      text
    );
  }
  const body = (await res.json()) as { authToken: string; organizationId: string; organizationSlug?: string };
  const cookie = `tj_auth_token=${body.authToken}`;
  const api = async (path: string, init: { method?: string; body?: unknown } = {}) => {
    const response = await fetch(`${target.url}/api${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Cookie: cookie,
        'tj-workspace-id': body.organizationId,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) {
      let message = text;
      try {
        message = JSON.parse(text).message ?? text;
      } catch {
        /* not JSON */
      }
      throw new ApiError(`${init.method ?? 'GET'} ${path} failed (HTTP ${response.status}) on ${target.url}: ${String(message).slice(0, 300)}`, response.status, text);
    }
    return text ? JSON.parse(text) : null;
  };
  return {
    ...target,
    organizationId: body.organizationId,
    organizationSlug: body.organizationSlug ?? undefined,
    email: jwtSubject(body.authToken),
    userId: jwtUserId(body.authToken),
    api,
  };
}
