import { Logger, UnauthorizedException } from '@nestjs/common';
import { SSOType } from '@entities/sso_config.entity';
import { getTooljetEdition } from './utils.helper';

export type SsoWorkspaceIsolationMode = 'report' | 'enforce';

const logger = new Logger('SsoWorkspaceIsolation');

/** SSO_WORKSPACE_ISOLATION; defaults to enforce on Cloud, report elsewhere. */
export function ssoWorkspaceIsolationMode(): SsoWorkspaceIsolationMode {
  const configured = process.env.SSO_WORKSPACE_ISOLATION?.trim().toLowerCase();
  if (configured === 'report' || configured === 'enforce') return configured;
  return getTooljetEdition() === 'cloud' ? 'enforce' : 'report';
}

/** Workspace configs whose identity provider is chosen by the workspace admin (not Google or github.com). */
export function isWorkspaceChosenIdentityProvider(sso: string, configs?: unknown): boolean {
  if (sso === SSOType.OPENID || sso === SSOType.SAML || sso === SSOType.LDAP) return true;
  return sso === SSOType.GIT && !!(configs as { hostName?: string } | undefined)?.hostName;
}

export function refuseOutsideSsoWorkspace(reason: string, context: Record<string, string | null | undefined>): void {
  if (ssoWorkspaceIsolationMode() === 'enforce') {
    throw new UnauthorizedException(
      'This sign-in method is not available for your account in this workspace. Sign in with the method you already use.'
    );
  }
  logger.warn(`would have refused: ${reason} ${JSON.stringify(context)}`);
}

export function checkSsoSessionWorkspace(
  session: { id: string; ssoOrganizationId?: string },
  organizationId: string
): void {
  if (!session.ssoOrganizationId || session.ssoOrganizationId === organizationId) return;
  refuseOutsideSsoWorkspace('session from another workspace identity provider', {
    userId: session.id,
    organizationId,
    ssoOrganizationId: session.ssoOrganizationId,
  });
}
