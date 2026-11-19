import { appendWorkspaceId, getTargetDomainURL, getWorkspaceIdOrSlugFromURL, isCustomDomain } from '@/_helpers/routes';
import { useSessionTransferRedirect } from '@/_helpers/useSessionTransferRedirect';
import { stripTrailingSlash } from '@/_helpers/utils';
import type { IOrganization } from '@/_stores/types/currentSessionStore';

// Shared by the desktop workspace lists and the mobile workspace drawer.
export function useSwitchOrganization() {
  const redirectWithSessionTransfer = useSessionTransferRedirect('switchOrganization');

  return (organizationToSwitch: IOrganization, newTab = false) => {
    const { id, slug } = organizationToSwitch;
    if ([id, slug].includes(getWorkspaceIdOrSlugFromURL())) return;

    const newPath = appendWorkspaceId(slug || id, window.location.pathname, true);
    const targetDomain = getTargetDomainURL(organizationToSwitch);
    const currentOrigin = window.location.origin;

    if (targetDomain && targetDomain !== currentOrigin) {
      redirectWithSessionTransfer(targetDomain, newPath, id, newTab);
    } else if (!targetDomain && isCustomDomain()) {
      const mainHost = window.public_config?.TOOLJET_HOST;
      if (!mainHost) {
        console.error('[switchOrganization] TOOLJET_HOST not configured, cannot redirect from custom domain');
        return;
      }
      redirectWithSessionTransfer(stripTrailingSlash(mainHost), newPath, id, newTab);
    } else if (newTab) {
      window.open(newPath, '_blank');
    } else {
      window.location.href = newPath;
    }
  };
}
