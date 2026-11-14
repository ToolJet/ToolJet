import * as React from 'react';
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';

import { cn } from '@/lib/utils';

type DrawerContextProps = {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props['modal'];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props['swipeDirection']>;
};

const DrawerContext = React.createContext<DrawerContextProps | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);

  if (!context) {
    throw new Error('useDrawer must be used within a Drawer.');
  }

  return context;
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = 'down',
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean;
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;
  const contextValue = React.useMemo(
    () => ({ hasSnapPoints, modal, showSwipeHandle, swipeDirection }),
    [hasSnapPoints, modal, showSwipeHandle, swipeDirection]
  );

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        'tw-fixed tw-inset-0 tw-z-50 tw-min-h-dvh tw-bg-black/30 tw-opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))] tw-transition-opacity tw-duration-[450ms] tw-ease-[cubic-bezier(0.32,0.72,0,1)] tw-select-none data-[ending-style]:tw-pointer-events-none data-[ending-style]:tw-opacity-0 data-[ending-style]:tw-duration-[calc(var(--drawer-swipe-strength)*400ms)] data-[snap-points]:[--drawer-overlay-min-opacity:0.5] data-[starting-style]:tw-opacity-0 data-[swiping]:tw-duration-0 supports-[backdrop-filter]:tw-backdrop-blur-sm supports-[-webkit-touch-callout:none]:tw-absolute',
        className
      )}
      {...props}
    />
  );
}

function DrawerSwipeHandle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "tw-relative tw-z-10 tw-flex tw-shrink-0 tw-cursor-grab tw-transition-opacity tw-duration-200 group-data-[nested-drawer-open]/drawer-popup:tw-opacity-0 group-data-[nested-drawer-swiping]/drawer-popup:tw-opacity-100 group-data-[swipe-axis=x]/drawer-popup:tw-h-full group-data-[swipe-axis=x]/drawer-popup:tw-w-3 group-data-[swipe-axis=x]/drawer-popup:tw-items-center group-data-[swipe-axis=y]/drawer-popup:tw-h-3 group-data-[swipe-axis=y]/drawer-popup:tw-w-full group-data-[swipe-axis=y]/drawer-popup:tw-justify-center group-data-[swipe-direction=down]/drawer-popup:tw-items-end group-data-[swipe-direction=left]/drawer-popup:tw-order-last group-data-[swipe-direction=left]/drawer-popup:tw-justify-start group-data-[swipe-direction=right]/drawer-popup:tw-justify-end group-data-[swipe-direction=up]/drawer-popup:tw-order-last group-data-[swipe-direction=up]/drawer-popup:tw-items-start after:tw-block after:tw-shrink-0 after:tw-rounded-full after:tw-bg-interactive-selected after:tw-content-[''] group-data-[swipe-axis=x]/drawer-popup:after:tw-h-[100px] group-data-[swipe-axis=x]/drawer-popup:after:tw-w-1.5 group-data-[swipe-axis=y]/drawer-popup:after:tw-h-1.5 group-data-[swipe-axis=y]/drawer-popup:after:tw-w-[100px] active:tw-cursor-grabbing",
        className
      )}
      {...props}
    />
  );
}

function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = useDrawer();
  const swipeAxis = swipeDirection === 'down' || swipeDirection === 'up' ? 'y' : 'x';

  return (
    <DrawerPortal data-slot="drawer-portal">
      {modal === true && <DrawerOverlay data-snap-points={hasSnapPoints ? '' : undefined} />}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className="tw-pointer-events-none tw-fixed tw-inset-0 tw-z-50 tw-select-none data-[modal=true]:tw-pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          data-snap-points={hasSnapPoints ? '' : undefined}
          className={cn(
            // Base.
            'tw-group/drawer-popup tw-pointer-events-auto tw-fixed tw-z-50 tw-m-[var(--drawer-inset,0px)] tw-flex tw-h-[var(--drawer-content-height)] tw-max-h-[var(--drawer-content-max-height,none)] tw-min-h-0 tw-w-[var(--drawer-content-width,auto)] [transform:translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))] tw-flex-col tw-rounded-3xl tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-text-sm tw-text-text-default tw-shadow-xl tw-transition-[transform,height,opacity,filter] tw-duration-[450ms] tw-ease-[cubic-bezier(0.22,1,0.36,1)] tw-will-change-transform tw-outline-none tw-select-none [--drawer-bleed-background:transparent] [--drawer-inset:0px] [--drawer-stacked-shadow:0_-20px_25px_-5px_rgb(0_0_0/0.1),0_-8px_10px_-6px_rgb(0_0_0/0.1)] [interpolate-size:allow-keywords] data-[swipe-direction=down]:data-[nested-drawer-open]:tw-shadow-[shadow:var(--drawer-stacked-shadow)]',
            // Nested.
            'data-[nested-drawer-open]:tw-overflow-hidden data-[nested-drawer-open]:tw-brightness-95',
            // Bleed.
            "after:tw-pointer-events-none after:tw-absolute after:tw-content-[''] after:tw-bg-[var(--drawer-bleed-background,var(--background-surface-layer-01))] data-[swipe-axis=x]:after:tw-inset-y-0 data-[swipe-axis=x]:after:tw-w-[var(--bleed)] data-[swipe-axis=y]:after:tw-inset-x-0 data-[swipe-axis=y]:after:tw-h-[var(--bleed)] data-[swipe-direction=down]:after:tw-top-full data-[swipe-direction=left]:after:tw-right-full data-[swipe-direction=right]:after:tw-left-full data-[swipe-direction=up]:after:tw-bottom-full",
            // Sizing.
            '[--drawer-content-height:var(--drawer-height,auto)] data-[swipe-axis=x]:[--drawer-content-width:75%] data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-6rem)] data-[swipe-axis=y]:data-[snap-points]:[--drawer-content-height:100dvh] data-[swipe-axis=x]:sm:[--drawer-content-width:24rem]',
            // Stack.
            '[--bleed:3rem] [--peek:1rem] [--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.05]',
            // Transitions.
            'data-[ending-style]:[transform:var(--closed-transform)] data-[ending-style]:tw-opacity-[0.9999] data-[ending-style]:tw-duration-[calc(var(--drawer-swipe-strength)*400ms)] data-[nested-drawer-swiping]:tw-duration-0 data-[ending-style]:data-[nested-drawer-swiping]:tw-duration-[calc(var(--drawer-swipe-strength)*400ms)] data-[starting-style]:[transform:var(--closed-transform)] data-[swiping]:tw-duration-0 data-[ending-style]:data-[swiping]:tw-duration-[calc(var(--drawer-swipe-strength)*400ms)]',
            // Axis: y.
            'data-[swipe-axis=y]:tw-inset-x-0 data-[swipe-axis=y]:data-[nested-drawer-open]:tw-h-[var(--stack-height)]',
            // Axis: x.
            'data-[swipe-axis=x]:tw-inset-y-0 data-[swipe-axis=x]:tw-flex-row',
            // Direction: down.
            'data-[swipe-direction=down]:tw-bottom-0 data-[swipe-direction=down]:tw-origin-bottom data-[swipe-direction=down]:tw-rounded-b-none data-[swipe-direction=down]:[--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)] data-[swipe-direction=down]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height)))]',
            // Direction: up.
            'data-[swipe-direction=up]:tw-top-0 data-[swipe-direction=up]:tw-origin-top data-[swipe-direction=up]:[--closed-transform:translate3d(0,calc(-100%-var(--drawer-inset,0px)-2px),0)] data-[swipe-direction=up]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--stack-shrink)*var(--stack-height)))]',
            // Direction: left.
            'data-[swipe-direction=left]:tw-left-0 data-[swipe-direction=left]:tw-origin-left data-[swipe-direction=left]:[--closed-transform:translate3d(calc(-100%-var(--drawer-inset,0px)-2px),0,0)] data-[swipe-direction=left]:[--translate-x:calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)+(var(--stack-shrink)*100%))]',
            // Direction: right.
            'data-[swipe-direction=right]:tw-right-0 data-[swipe-direction=right]:tw-origin-right data-[swipe-direction=right]:[--closed-transform:translate3d(calc(100%+var(--drawer-inset,0px)+2px),0,0)] data-[swipe-direction=right]:[--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)-(var(--stack-shrink)*100%))]',
            className
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              'tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden tw-overscroll-contain tw-rounded-[inherit] tw-transition-opacity tw-duration-300 tw-ease-[cubic-bezier(0.45,1.005,0,1.005)] tw-select-text group-data-[nested-drawer-open]/drawer-popup:tw-opacity-0 group-data-[nested-drawer-swiping]/drawer-popup:tw-opacity-100 group-data-[swiping]/drawer-popup:tw-select-none'
            )}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'tw-flex tw-shrink-0 tw-flex-col tw-gap-0.5 tw-p-4 tw-pb-0 group-data-[swipe-axis=y]/drawer-popup:tw-text-center md:tw-gap-1.5 md:tw-text-left',
        className
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('tw-mt-auto tw-flex tw-shrink-0 tw-flex-col tw-gap-2 tw-p-4 tw-pt-0', className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('tw-text-base tw-font-medium tw-text-text-default', className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('tw-text-sm tw-text-balance tw-text-text-placeholder', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
