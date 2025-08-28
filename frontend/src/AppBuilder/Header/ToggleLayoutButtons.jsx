import React from 'react';
import cx from 'classnames';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Button } from '@/components/ui/Button/Button';
import { Monitor, Smartphone } from 'lucide-react';

export function ToggleLayoutButtons({
  currentLayout,
  toggleCurrentLayout,
  clearSelectionBorder,
  showFullWidth,
  darkMode,
}) {
  return (
    <div className={cx({ '!tw-w-100': showFullWidth })} data-cy="layout-toggle-container">
      <div
        className="d-flex align-items-center p-1 current-layout tw-gap-0.5"
        role="tablist"
        aria-orientation="horizontal"
        data-cy="layout-toggle-buttons"
      >
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="desktop-layout-tooltip">Desktop Layout</Tooltip>}>
          <Button
            variant="ghost"
            className={cx({
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
          >
            <Monitor width="16" height="16" className="tw-text-icon-strong" />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="mobile-layout-tooltip">Mobile Layout</Tooltip>}>
          <Button
            variant="ghost"
            className={cx({
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
          >
            <Smartphone width="16" height="16" className="tw-text-icon-strong" />
          </Button>
        </OverlayTrigger>
      </div>
    </div>
  );
}
