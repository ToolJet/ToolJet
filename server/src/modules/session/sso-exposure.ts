/**
 * Which principals may receive the owner's stored upstream SSO data (IdP userinfo and any
 * access, id or refresh tokens) in a browser response.
 *
 * Only an ordinary browser session. Token sessions (workspace and app tokens, render sessions
 * minted from them) and OAuth delegated or viewer credentials act for the owner in a narrower
 * role, and the page they load can read any response it fetches, so they never receive it.
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

export function isTokenOrDelegatedPrincipal(user: Principal): boolean {
  return !!(
    user &&
    (user.oauthGrantId || user.oauthAppId || user.oauthTokenId || user.isPATLogin || user.patScope || user.patAppId)
  );
}

/** The SSO data a response may carry: the stored value unchanged, or an empty object for any token principal. */
export function browserSsoUserInfo(ssoUserInfo: any, ...principals: Principal[]): any {
  return principals.some(isTokenOrDelegatedPrincipal) ? {} : ssoUserInfo;
}
