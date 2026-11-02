import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';
import { ToolTip } from '@/_components/ToolTip';

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
        <ToolTip message="Desktop layout" placement="bottom">
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
              width="15"
              height="15"
              strokeWidth={1.8}
              className={cn('tw-text-icon-strong', { 'tw-text-icon-disabled': isDesktopLayoutDisabled })}
            />
          </Button>
        </ToolTip>

        <ToolTip message="Mobile layout" placement="bottom">
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
              width="15"
              height="15"
              strokeWidth={1.8}
              className={cn('tw-text-icon-strong', { 'tw-text-icon-disabled': isMobileLayoutDisabled })}
            />
          </Button>
        </ToolTip>
      </div>
    </div>
  );
}
