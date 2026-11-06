import React, { useState } from 'react';
import { X } from 'lucide-react';

import { authenticationService } from '@/_services/authentication.service';
import { InlineInfo } from '@/components/ui/Rocket/InlineInfo/InlineInfo';

const storageKeyFor = (userId: string) => `tj-mobile-builder-banner-dismissed:${userId}`;

const readDismissed = (key: string) => {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

// Figma 2074-1729. End users never see builder actions, so the note is only for the other roles.
export function BuilderActionsBanner() {
  const { role, current_user: user } = authenticationService.currentSessionValue;
  const storageKey = storageKeyFor(user?.id ?? '');
  const [dismissed, setDismissed] = useState(() => readDismissed(storageKey));

  if (role?.name === 'end-user' || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Dismissed for this visit only.
    }
  };

  return (
    <div className="tw-relative">
      <InlineInfo
        type="info"
        variant="filled"
        description="Builder actions are only available on desktop."
        className="tw-items-center tw-pr-11 !tw-text-text-accent"
      />
      <button
        type="button"
        aria-label="Dismiss"
        className="tw-absolute tw-right-1 tw-top-1/2 tw-flex tw-size-11 -tw-translate-y-1/2 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-accent"
        onClick={handleDismiss}
      >
        <X aria-hidden className="tw-size-4" />
      </button>
    </div>
  );
}
