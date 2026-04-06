import { useRef } from 'react';
import { sessionTransferService } from '@/_services/session-transfer.service';

const NEW_TAB_COOLDOWN_MS = 500;

export function useSessionTransferRedirect(logPrefix = 'sessionTransfer') {
  const transferringRef = useRef(false);

  const redirectWithSessionTransfer = async (targetDomain, path, targetOrgId, newTab = false) => {
    if (transferringRef.current) return;
    transferringRef.current = true;
    try {
      const { token } = await sessionTransferService.createTransferToken(targetOrgId);
      const redirect = encodeURIComponent(path);
      const url = `${targetDomain}/api/session/transfer?token=${token}&redirect=${redirect}`;
      newTab ? window.open(url, '_blank') : (window.location.href = url);
    } catch (e) {
      console.error(`[${logPrefix}] Transfer token failed, falling back to direct redirect:`, e);
      const url = `${targetDomain}${path}`;
      newTab ? window.open(url, '_blank') : (window.location.href = url);
    } finally {
      // For new-tab opens, the component stays mounted — add a brief cooldown
      if (newTab) {
        setTimeout(() => {
          transferringRef.current = false;
        }, NEW_TAB_COOLDOWN_MS);
      }
      // For same-window redirect, page unloads — no reset needed
    }
  };

  return redirectWithSessionTransfer;
}
