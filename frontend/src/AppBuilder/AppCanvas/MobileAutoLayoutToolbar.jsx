import React, { useEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { isEmpty } from 'lodash';
import cx from 'classnames';
import { TriangleAlert } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { computeAutoMobileLayout } from './Grid/gridUtils';
import { CANVAS_WIDTHS } from './appCanvasConstants';
import ManageMobileVisibilityDialog from './PageMenu/ManageMobileVisibilityDialog';
import './MobileAutoLayoutToolbar.scss';
import {
  Switch,
  Button,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogMedia,
} from '@/components/ui/Rocket';

const CONFIRM_COPY = {
  on: {
    title: 'Turn on auto layout?',
    description:
      'Components will stack in a single column and stay in sync with desktop. Manual positioning turns off, and your current mobile layout will be reset.',
    action: 'Turn on auto layout',
  },
  off: {
    title: 'Turn off auto stacking?',
    description:
      'Position components freely on the mobile canvas. Desktop changes will stop syncing to mobile, and turning auto stacking back on later resets manual positions.',
    action: 'Turn off auto layout',
  },
};

// Mobile-layout bottom toolbar: auto-stacking toggle + manage hidden components; hosts the compute effect.
export default function MobileAutoLayoutToolbar({ currentLayout, darkMode, moduleId = 'canvas' }) {
  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const isAutoMobileLayout = useStore((state) => state.getIsAutoMobileLayout(moduleId), shallow);
  const setComponentLayout = useStore((state) => state.setComponentLayout, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const turnOnAutoComputeLayout = useStore((state) => state.turnOnAutoComputeLayout, shallow);
  const turnOffAutoComputeLayout = useStore((state) => state.turnOffAutoComputeLayout, shallow);
  const lastComputedRef = useRef();

  const [confirm, setConfirm] = useState(null); // 'on' | 'off' | null
  const [manageOpen, setManageOpen] = useState(false);

  // Keep the current page's mobile layout in sync with desktop.
  useEffect(() => {
    if (currentLayout !== 'mobile' || !isAutoMobileLayout) return;
    const updatedBoxes = computeAutoMobileLayout(currentPageComponents);
    if (isEmpty(diff(lastComputedRef.current, updatedBoxes))) return;
    lastComputedRef.current = updatedBoxes;
    setComponentLayout(updatedBoxes, undefined, moduleId, { skipUndoRedo: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayout, currentPageComponents, isAutoMobileLayout, moduleId]);

  const hiddenCount = useMemo(
    () =>
      Object.values(currentPageComponents).filter(
        (comp) => !getResolvedValue(comp?.component?.definition?.others?.showOnMobile?.value)
      ).length,
    [currentPageComponents, getResolvedValue]
  );

  if (currentLayout !== 'mobile') return null;

  const handleToggle = (next) => setConfirm(next ? 'on' : 'off');

  const handleConfirm = () => {
    if (confirm === 'on') turnOnAutoComputeLayout(moduleId);
    else if (confirm === 'off') turnOffAutoComputeLayout(moduleId);
    setConfirm(null);
  };

  const copy = confirm ? CONFIRM_COPY[confirm] : null;

  return (
    <>
      <div
        data-cy="mobile-auto-layout-toolbar"
        className={cx(
          'tw-bg-background-surface-layer-01 tw-border tw-border-border-weak tw-shadow-elevation-100 tw-rounded-lg',
          { 'dark-theme theme-dark': darkMode }
        )}
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 51,
          // Match the mobile frame width
          width: '100%',
          maxWidth: CANVAS_WIDTHS.deviceWindowWidth,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
        }}
      >
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-text-xs tw-text-text-default">Enable auto layout</span>
                <Switch
                  checked={isAutoMobileLayout}
                  onCheckedChange={handleToggle}
                  data-cy="enable-auto-layout-toggle"
                />
              </div>
            </TooltipTrigger>
            {/* offsets align it to the toolbar's left edge and lift it above the toolbar */}
            <TooltipContent
              side="top"
              align="start"
              alignOffset={-12}
              sideOffset={20}
              showArrow={false}
              className="tw-max-w-[220px]"
            >
              Auto layout stacks components in a single column on mobile. Keep off to position them manually.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* divider centered in the toolbar, independent of content */}
        <div className="tw-absolute tw-left-1/2 tw-top-1/2 tw--translate-x-1/2 tw--translate-y-1/2 tw-h-[17.5px] tw-w-px tw-bg-border-weak" />

        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-text-xs tw-text-text-placeholder">{hiddenCount} hidden components</span>
          <Button
            variant="outline"
            size="small"
            onClick={() => setManageOpen(true)}
            data-cy="manage-hidden-components-button"
          >
            manage
          </Button>
        </div>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(next) => !next && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlert className="tw-size-10 tw-text-icon-brand" />
            </AlertDialogMedia>
            <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="primary" onClick={handleConfirm} data-cy="confirm-auto-layout-toggle">
                {copy?.action}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* mount only when open so it doesn't subscribe/recompute while closed */}
      {manageOpen && <ManageMobileVisibilityDialog open onClose={() => setManageOpen(false)} moduleId={moduleId} />}
    </>
  );
}
