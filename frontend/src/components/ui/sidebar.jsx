import * as React from 'react';
import { cn } from '@/lib/utils';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_ICON = '3rem';

const SidebarContext = React.createContext(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

const SidebarProvider = React.forwardRef(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      sidebarWidth,
      sidebarWidthIcon,
      ...props
    },
    ref
  ) => {
    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value) => {
        const openState = typeof value === 'function' ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open]
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return setOpen((open) => !open);
    }, [setOpen]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        toggleSidebar,
      }),
      [state, open, setOpen, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          style={{
            '--sidebar-width': sidebarWidth || SIDEBAR_WIDTH,
            '--sidebar-width-icon': sidebarWidthIcon || SIDEBAR_WIDTH_ICON,
            ...style,
          }}
          className={cn('tw-group/sidebar-wrapper tw-flex tw-h-full tw-w-full', className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

const Sidebar = React.forwardRef(
  ({ side = 'left', variant = 'sidebar', collapsible = 'icon', className, children, ...props }, ref) => {
    const { state } = useSidebar();

    if (collapsible === 'none') {
      return (
        <div className={cn('tw-flex tw-h-full tw-w-[--sidebar-width] tw-flex-col', className)} ref={ref} {...props}>
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className="tw-group tw-peer tw-hidden md:tw-block"
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            'tw-relative tw-w-[--sidebar-width] tw-bg-transparent tw-transition-[width] tw-duration-200 tw-ease-linear',
            'group-data-[collapsible=offcanvas]:tw-w-0',
            'group-data-[side=right]:tw-rotate-180',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:tw-w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
              : 'group-data-[collapsible=icon]:tw-w-[--sidebar-width-icon]'
          )}
        />
        <div
          className={cn(
            'tw-hidden tw-h-full tw-w-[--sidebar-width] tw-transition-[left,right,width] tw-duration-200 tw-ease-linear md:tw-flex',
            side === 'left'
              ? 'tw-left-0 group-data-[collapsible=offcanvas]:tw-left-[calc(var(--sidebar-width)*-1)]'
              : 'tw-right-0 group-data-[collapsible=offcanvas]:tw-right-[calc(var(--sidebar-width)*-1)]',
            // Adjust the padding for floating and inset variants.
            variant === 'floating' || variant === 'inset'
              ? 'tw-p-2 group-data-[collapsible=icon]:tw-w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
              : 'group-data-[collapsible=icon]:tw-w-[--sidebar-width-icon]',
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="tw-flex tw-h-full tw-w-full tw-flex-col group-data-[variant=floating]:tw-rounded-lg group-data-[variant=floating]:tw-border group-data-[variant=floating]:tw-border-sidebar-border group-data-[variant=floating]:tw-shadow"
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} data-sidebar="header" className={cn('tw-flex tw-flex-col', className)} {...props} />;
});
SidebarHeader.displayName = 'SidebarHeader';

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} data-sidebar="footer" className={cn('tw-flex tw-flex-col', className)} {...props} />;
});
SidebarFooter.displayName = 'SidebarFooter';

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn('tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-auto', className)}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

export { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider, useSidebar };
