import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';

export function ToggleLayoutButtons({
  currentLayout,
  toggleCurrentLayout,
  clearSelectionBorder,
  showFullWidth,
  darkMode,
}) {
  const isAiBuildingApp = useStore((state) => state.ai?.isLoading ?? false);

  const isDesktopLayoutDisabled = isAiBuildingApp && currentLayout === 'mobile';
  const isMobileLayoutDisabled = isAiBuildingApp && currentLayout === 'desktop';

  return (
    <div className={cn({ '!tw-w-100': showFullWidth })} data-cy="layout-toggle-container">
      <div
        className="d-flex align-items-center p-1 current-layout tw-gap-0.5"
        role="tablist"
        aria-orientation="horizontal"
        data-cy="layout-toggle-buttons"
      >
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="desktop-layout-tooltip">Desktop Layout</Tooltip>}>
          <Button
            variant="ghost"
            className={cn({
              'tw-pressed tw-bg-button-outline-pressed': currentLayout === 'desktop',
            })}
            iconOnly
            aria-label="Switch to desktop layout"
            aria-selected={currentLayout === 'desktop'}
            tabIndex={currentLayout === 'desktop' ? 0 : -1}
            type="button"
            onClick={() => {
              toggleCurrentLayout('desktop');
              clearSelectionBorder();
            }}
            data-cy="button-change-layout-to-desktop"
            disabled={isDesktopLayoutDisabled}
          >
            <Monitor
              width="16"
              height="16"
              className={cn('tw-text-icon-strong', { 'tw-text-icon-disabled': isDesktopLayoutDisabled })}
            />
          </Button>
        </OverlayTrigger>

        <OverlayTrigger placement="bottom" overlay={<Tooltip id="mobile-layout-tooltip">Mobile Layout</Tooltip>}>
          <Button
            variant="ghost"
            className={cn({
              'tw-pressed tw-bg-button-outline-pressed': currentLayout === 'mobile',
            })}
            iconOnly
            aria-label="Switch to mobile layout"
            aria-selected={currentLayout === 'mobile'}
            tabIndex={currentLayout === 'mobile' ? 0 : -1}
            type="button"
            onClick={() => {
              toggleCurrentLayout('mobile');
              clearSelectionBorder();
            }}
            data-cy="button-change-layout-to-mobile"
            disabled={isMobileLayoutDisabled}
          >
            <Smartphone
              width="16"
              height="16"
              className={cn('tw-text-icon-strong', { 'tw-text-icon-disabled': isMobileLayoutDisabled })}
            />
          </Button>
        </OverlayTrigger>
      </div>
    </div>
  );
}
