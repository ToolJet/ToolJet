import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticationService } from '@/_services/authentication.service';
import { getPrivateRoute } from '@/_helpers/routes';
import { fetchEdition } from '@/modules/common/helpers/utils';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

const SELF_HOSTED_PRICING_URL = 'https://tooljet.com/pricing';

/**
 * Where "Upgrade" goes, unchanged from today: cloud workspace admins open the subscription page,
 * self-hosted super admins open the pricing page. Everyone else can't upgrade (canUpgrade false).
 * `openLicensing` is the in-app alternative used by plan tags: the subscription page on cloud, the
 * license page in instance settings on self-hosted.
 */
export default function useUpgradeAction() {
  const navigate = useNavigate();
  const edition = fetchEdition();
  const session = authenticationService.currentSessionValue;
  const canUpgrade = edition === 'cloud' ? !!session?.admin : edition === 'ee' ? !!session?.super_admin : false;

  const upgrade = useCallback(() => {
    if (edition === 'cloud') {
      posthogHelper?.captureEvent?.('click_upgrade_plan', { workspace_id: session?.current_organization_id });
      navigate(`${getPrivateRoute('subscription')}?currentTab=upgradePlan`);
      return;
    }
    window.open(SELF_HOSTED_PRICING_URL, '_blank', 'noopener');
  }, [edition, navigate, session?.current_organization_id]);

  const openLicensing = useCallback(() => {
    posthogHelper?.captureEvent?.('click_upgrade_plan', { workspace_id: session?.current_organization_id });
    navigate(getPrivateRoute(edition === 'cloud' ? 'subscription' : 'license'));
  }, [edition, navigate, session?.current_organization_id]);

  return { canUpgrade, upgrade, openLicensing };
}
