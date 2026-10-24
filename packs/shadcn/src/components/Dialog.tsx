import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { themeVars } from '../lib/themeVars';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../lib/usePortalContainer';
import { ownerAvailable } from '../lib/useOwnerGuard';
import { POPUP_LAYER, popupLayerOf } from '../lib/popupLayer';
import { LoadingBox, LoadingFrame, useLoading } from '../lib/ui2/loading/look';

// The overlay's and the dialog's own levels in ui.css (.ui-dialog-overlay, .ui-dialog); popups opened from the body
// go one above (lib/popupLayer).
const OVERLAY_Z = 1000;

export const Dialog = () => {
  const [triggerText] = ToolJet.useStateString({ name: 'triggerText', label: 'Button label', initialValue: 'Delete account' });
  const [triggerVariant] = ToolJet.useStateEnumeration({
    name: 'triggerVariant',
    label: 'Button variant',
    enumDefinition: ['default', 'secondary', 'outline', 'destructive'],
    initialValue: 'outline',
    section: 'Appearance',
  });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Are you absolutely sure?' });
  const [description] = ToolJet.useStateString({
    name: 'description',
    label: 'Description',
    initialValue: 'This action cannot be undone. This will permanently delete your account and remove your data.',
  });
  const [confirmText] = ToolJet.useStateString({ name: 'confirmText', label: 'Confirm label', initialValue: 'Continue' });
  const [cancelText] = ToolJet.useStateString({ name: 'cancelText', label: 'Cancel label', initialValue: 'Cancel' });
  const [destructive] = ToolJet.useStateBoolean({
    name: 'destructive',
    label: 'Destructive confirm',
    initialValue: true,
    section: 'Appearance',
  });
  const [open, setOpen] = ToolJet.useStateBoolean({ name: 'isOpen', initialValue: false, inspector: 'hidden' });
  // Built in: the body is a canvas of ToolJet components (a form, details), under the description.
  const [showBody] = ToolJet.useStateBoolean({ name: 'showBody', label: 'Components in the body', initialValue: true });
  const [showFooter] = ToolJet.useStateBoolean({ name: 'showFooter', label: 'Confirm and cancel buttons', initialValue: true });
  const [bodyHeight] = ToolJet.useStateNumber({
    name: 'bodyHeight',
    label: 'Body height (px)',
    initialValue: 240,
    min: 40,
    max: 2000,
    visibleWhen: { key: 'showBody', value: true },
  });
  const [, setShow] = ToolJet.useStateBoolean({ name: 'show', initialValue: false, inspector: 'hidden' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  React.useEffect(() => setShow(open), [open, setShow]);
  const onOpen = ToolJet.useEventCallback({ name: 'onOpen' });
  const onConfirm = ToolJet.useEventCallback({ name: 'onConfirm' });
  const onCancel = ToolJet.useEventCallback({ name: 'onCancel' });
  const [anchorRef, container] = usePortalContainer();
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const { disabled } = ToolJet.useControlState();

  // The dialog portals out of the widget, so the host's Disable (and a disabled parent such as Tabs, which makes the
  // widget inert) never reached its buttons: Confirm still ran (SP-02). While its owner takes no input the dialog
  // stays open, keeping what was typed in the body, and refuses to confirm; Cancel, Escape and the backdrop still
  // close it. Checked each frame while open, as the host's inert attribute re-renders nothing here. The owner need not
  // be drawn: an action opens a dialog whose own button is hidden.
  const takesInput = React.useCallback(
    () => !disabled && ownerAvailable(anchorRef.current, { requireDrawn: false }),
    [anchorRef, disabled]
  );
  const [blocked, setBlocked] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    let frame = 0;
    const watch = () => {
      setBlocked(!takesInput());
      frame = requestAnimationFrame(watch);
    };
    watch();
    return () => cancelAnimationFrame(frame);
  }, [open, takesInput]);

  // Both exposed names change before an event fires: show followed isOpen only in the effect above, after the
  // handlers had run, so an onCancel, onConfirm or onClose handler still read show: true.
  const setBoth = (next: boolean) => {
    setOpen(next);
    setShow(next);
  };
  const show = () => {
    setBoth(true);
    onOpen();
  };
  const close = (confirmed: boolean) => {
    if (confirmed && !takesInput()) return;
    setBoth(false);
    if (confirmed) onConfirm();
    else onCancel();
    onClose();
  };
  // The body's components are not inside the dialog in React's tree (the host renders them in the popup layer's light
  // DOM, projected through the body's <slot>) and their popups portal beside it, so Radix took a press on any of them
  // for one outside and cancelled the dialog: a DatePicker's trigger in the body dismissed it and lost the typed draft
  // (SP-28; a text field survived only because the host stops its mousedown). A modal dialog leaves the page no
  // pointer events, so a press outside its content reaches either its own backdrop or a popup opened from its body:
  // only the backdrop dismisses.
  const keepUnlessBackdrop = (event: { detail: { originalEvent: Event }; preventDefault: () => void }) => {
    const overlay = overlayRef.current;
    if (!overlay || !event.detail.originalEvent.composedPath().includes(overlay)) event.preventDefault();
  };
  // Inside another dialog's body this one stacks above that dialog, and the body's popups above this one.
  const base = open ? popupLayerOf(anchorRef.current) : undefined;
  const layer = base === undefined ? OVERLAY_Z : base;

  ToolJet.useAction({ name: 'open', displayName: 'Open' }, show);
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => {
    setBoth(false);
    onClose();
  });
  // Empty = the trigger variant's own colors (see Button).
  const buttonColor = ToolJet.useStyleString({ name: 'buttonColor', label: 'Button background', inspector: 'color', initialValue: '' });
  const buttonText = ToolJet.useStyleString({ name: 'buttonTextColor', label: 'Button text', inspector: 'color', initialValue: '' });
  const background = ToolJet.useStyleString({ name: 'dialogBackground', label: 'Dialog background', inspector: 'color', initialValue: 'var(--cc-surface1-surface)', section: 'Dialog' });
  const radius = ToolJet.useStyleNumber({ name: 'dialogRadius', label: 'Dialog radius', initialValue: '', section: 'Dialog' });
  const loadingNow = useLoading();
  ToolJet.useComponentSettings({ defaultWidth: 7, defaultHeight: 4 });

  return (
    <LoadingFrame loading={loadingNow} look={<LoadingBox />}>
      <div className="ui" ref={anchorRef} style={{ display: 'flex', alignItems: 'center', ...themeVars({ buttonColor, buttonText }) }}>
        <DialogPrimitive.Root
          open={open}
          onOpenChange={(next) => {
            if (next) show();
            else close(false);
          }}
        >
          <DialogPrimitive.Trigger asChild>
            <button type="button" className={cn('ui-btn', `ui-btn--${triggerVariant}`)} disabled={!!disabled}>
              {triggerText}
            </button>
          </DialogPrimitive.Trigger>
          {container ? (
            <DialogPrimitive.Portal container={container}>
              <DialogPrimitive.Overlay
                ref={overlayRef}
                className="ui-dialog-overlay"
                style={base === undefined ? undefined : { zIndex: layer }}
              />
              <DialogPrimitive.Content
                className="ui-popup ui-dialog"
                style={{
                  ...themeVars({ bg: background }),
                  borderRadius: radius,
                  ...(base === undefined ? {} : { zIndex: layer + 1 }),
                  [POPUP_LAYER as string]: layer + 2,
                }}
                onPointerDownOutside={keepUnlessBackdrop}
              >
                <div>
                  <DialogPrimitive.Title className="ui-dialog-title">{title}</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="ui-dialog-desc">{description}</DialogPrimitive.Description>
                </div>
                {showBody ? (
                  <ToolJet.PopupSlot
                    name="body"
                    style={{ height: Math.min(2000, Math.max(40, Number(bodyHeight) || 240)) }}
                  />
                ) : null}
                {showFooter ? <div className="ui-dialog-footer">
                  <button type="button" className="ui-btn ui-btn--outline" onClick={() => close(false)}>
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={cn('ui-btn', destructive ? 'ui-btn--destructive' : 'ui-btn--default')}
                    disabled={blocked}
                    onClick={() => close(true)}
                  >
                    {confirmText}
                  </button>
                </div> : null}
                <DialogPrimitive.Close asChild>
                  <button type="button" className="ui-icon-btn ui-dialog-close" aria-label="Close">
                    <X />
                  </button>
                </DialogPrimitive.Close>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          ) : null}
        </DialogPrimitive.Root>
      </div>
    </LoadingFrame>
  );
};
