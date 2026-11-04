import { PersonalAccessTokenScope } from '@modules/external-apis/constants';

/**
 * Which principals may receive the stored upstream SSO data (IdP userinfo and any access, id or
 * refresh tokens) in a browser response.
 *
 * An ordinary browser session, and an embed session: an app token (patScope 'app') is minted by
 * the external API for the person who views the embed, so the data is that person's own and
 * `{{globals.currentUser.ssoUserInfo}}` keeps working in embeds.
 *
 * Never a workspace token session, nor the app-pinned render session minted from one for the AI
 * build's render check (patScope 'workspace' with an app id), nor an OAuth delegated or viewer
 * credential. Those act for the owner in a narrower role, and the page they load can read any
 * response it fetches. The two token kinds are told apart by the signed patScope claim, set at
 * mint time from the token row: the exchange for workspace tokens only accepts workspace-scope
 * rows, and the embed exchange only app-bound ones (see personal-access-tokens/AGENTS.md).
 * Server-side query bindings read the stored values directly and are unaffected.
 */
type Principal =
  | {
      oauthGrantId?: string;
      oauthAppId?: string;
      oauthTokenId?: string;
      isPATLogin?: boolean;
      patScope?: string;
      patAppId?: string;
    }
  | null
  | undefined;

/** An embed viewer session. Sessions minted before patScope existed carried an app id only for embeds. */
export function isEmbedSession(user: Principal): boolean {
  if (!user) return false;
  return user.patScope === PersonalAccessTokenScope.APP || (!user.patScope && !!user.patAppId);
}

export function withholdsUpstreamSso(user: Principal): boolean {
  if (!user) return false;
  if (user.oauthGrantId || user.oauthAppId || user.oauthTokenId) return true;
  const tokenSession = !!(user.isPATLogin || user.patScope || user.patAppId);
  return tokenSession && !isEmbedSession(user);
}

/** The SSO data a response may carry: the stored value unchanged, or an empty object when any principal withholds it. */
export function browserSsoUserInfo(ssoUserInfo: any, ...principals: Principal[]): any {
  return principals.some(withholdsUpstreamSso) ? {} : ssoUserInfo;
}
