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
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import { useValueSetter } from '../lib/sameValue';
import { displayText } from '../lib/displayText';
import { useKeptPopupSlot } from '../lib/keptPopupSlot';

// The overlay's and the dialog's own levels in ui.css (.ui-dialog-overlay, .ui-dialog); popups opened from the body
// go one above (lib/popupLayer).
const OVERLAY_Z = 1000;

export const Dialog = () => {
  const [rawTriggerText] = ToolJet.useStateString({
    name: 'triggerText',
    label: 'Button label',
    initialValue: 'Delete account',
  });
  const [triggerVariant] = ToolJet.useStateEnumeration({
    name: 'triggerVariant',
    label: 'Button variant',
    enumDefinition: ['default', 'secondary', 'outline', 'destructive'],
    initialValue: 'outline',
    section: 'Appearance',
  });
  const [rawTitle] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Are you absolutely sure?' });
  const [rawDescription] = ToolJet.useStateString({
    name: 'description',
    label: 'Description',
    initialValue: 'This action cannot be undone. This will permanently delete your account and remove your data.',
  });
  const [rawConfirmText] = ToolJet.useStateString({
    name: 'confirmText',
    label: 'Confirm label',
    initialValue: 'Continue',
  });
  const [rawCancelText] = ToolJet.useStateString({ name: 'cancelText', label: 'Cancel label', initialValue: 'Cancel' });
  // An object bound to a text property would throw as a React child and replace the whole Dialog.
  const [triggerText, title, description, confirmText, cancelText] = [
    rawTriggerText,
    rawTitle,
    rawDescription,
    rawConfirmText,
    rawCancelText,
  ].map(displayText);
  const [destructive] = ToolJet.useStateBoolean({
    name: 'destructive',
    label: 'Destructive confirm',
    initialValue: true,
    section: 'Appearance',
  });
  // Exposed as show, UI 2.0's Modal name.
  const [open, setOpen] = ToolJet.useStateBoolean({ name: 'show', initialValue: false, inspector: 'hidden' });
  // In the editor it draws no backdrop and stays open on outside presses, so the builder can use the panels and drop
  // components into its body while it is open.
  const editing = ToolJet.useEditing();
  // Built in: the body is a canvas of ToolJet components (a form, details), under the description.
  const [showBody] = ToolJet.useStateBoolean({ name: 'showBody', label: 'Components in the body', initialValue: true });
  const [showFooter] = ToolJet.useStateBoolean({
    name: 'showFooter',
    label: 'Confirm and cancel buttons',
    initialValue: true,
  });
  const [bodyHeight] = ToolJet.useStateNumber({
    name: 'bodyHeight',
    label: 'Body height (px)',
    initialValue: 240,
    min: 40,
    max: 2000,
    visibleWhen: { key: 'showBody', value: true },
  });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
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

  // Live: an open or close action on a dialog already open or closed fires nothing (lib/sameValue).
  const openSetter = useValueSetter(open === true, setOpen);
  const show = () => {
    if (openSetter.set(true)) onOpen();
  };
  const close = (confirmed: boolean) => {
    if (confirmed && !takesInput()) return;
    openSetter.set(false);
    if (confirmed) onConfirm();
    else onCancel();
    onClose();
  };
  // The body's components are not inside the dialog in React's tree (the host renders them in the popup layer's light
  // DOM, projected through the body's <slot>) and their popups portal beside it, so Radix took a press on any of them
  // for one outside and cancelled the dialog: a DatePicker's trigger in the body dismissed it and lost the typed draft
  // (SP-28; a text field survived only because the host stops its mousedown). Only a press on its own backdrop
  // dismisses it.
  // It is not a Radix modal: that set pointer-events: none on the page's body and pulled focus back into itself, so
  // what opens above it from elsewhere (a ToolJet Dropdown's menu, a ToolJet Modal, another pack's dialog) took no
  // click and kept no focus (PKB-04, -05, -06). Its backdrop, drawn here, blocks what is under it instead.
  // Radix decides on the click that ends the press, when the pointerdown's composedPath() is already empty, so the
  // overlay notes the press it took and the check compares the event itself.
  const backdropPress = React.useRef<Event | null>(null);
  // An Escape pressed in a dialog above this one (another pack's popup layer, a ToolJet Modal) closes that one only:
  // Radix listens on the document and took it for this dialog's too, leaving the one above open alone (PKB-06).
  // Radix marks every Escape it handles with preventDefault, and the dialog above may skip a marked one (a ToolJet
  // Modal does, taking it for a nested popup's), so the event is left unmarked: its preventDefault does nothing for this
  // event, and the close Radix then asks for is ignored.
  const contentRef = React.useRef<HTMLDivElement>(null);
  const escapeAbove = React.useRef<Event | null>(null);
  const leaveEscapeToAbove = (event: KeyboardEvent) => {
    escapeAbove.current = event;
    Object.defineProperty(event, 'preventDefault', { value: () => {}, configurable: true });
    setTimeout(() => {
      if (escapeAbove.current === event) escapeAbove.current = null;
    }, 0);
  };
  const escapeFromAbove = (event: KeyboardEvent) => {
    const root = contentRef.current?.getRootNode();
    const ownLayer = root instanceof ShadowRoot ? root.host : null;
    return event
      .composedPath()
      .some(
        (node) =>
          node instanceof HTMLElement &&
          node !== ownLayer &&
          (node.classList.contains('tj-cc-popup-host') || node.classList.contains('modal'))
      );
  };
  const keepUnlessBackdrop = (event: { detail: { originalEvent: Event }; preventDefault: () => void }) => {
    const press = event.detail.originalEvent;
    const overlay = overlayRef.current;
    const onBackdrop = press === backdropPress.current || (!!overlay && press.composedPath().includes(overlay));
    backdropPress.current = null;
    if (!onBackdrop) event.preventDefault();
  };
  // Inside another dialog's body this one stacks above that dialog, and the body's popups above this one.
  const base = open ? popupLayerOf(anchorRef.current) : undefined;
  const layer = base === undefined ? OVERLAY_Z : base;

  ToolJet.useAction({ name: 'open', displayName: 'Open' }, show);
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => {
    if (openSetter.set(false)) onClose();
  });
  // Empty = the trigger variant's own colors (see Button).
  const buttonColor = useThemeColor('buttonColor', 'Button background', TOKEN.surface);
  const buttonText = useThemeColor('buttonTextColor', 'Button text', TOKEN.text);
  const background = ToolJet.useStyleString({
    name: 'dialogBackground',
    label: 'Dialog background',
    inspector: 'color',
    initialValue: 'var(--cc-surface1-surface)',
    section: 'Dialog',
  });
  const radius = useThemeRadius('dialogRadius', 'Dialog radius', { section: 'Dialog' });
  const loadingNow = useLoading();
  // The body's components stay mounted while the dialog is closed, so a draft typed in them survives Cancel, the X
  // and a close action, as in the Ant and MUI packs (BN-01). Clearing them stays explicit (clearForm, an action).
  const [bodyKeeper, bodyPlace] = useKeptPopupSlot('body', {
    enabled: !!showBody,
    // At its own height when the dialog is capped at the screen: the dialog scrolls rather than squeeze the body.
    style: { height: Math.min(2000, Math.max(40, Number(bodyHeight) || 240)), flexShrink: 0 },
  });
  ToolJet.useComponentSettings({
    role: 'dialog',
    fit: false,
    loading: 'own',
    usage:
      'A dialog with its own trigger button or open/close actions: title, description, a body canvas of components (bodyHeight), confirm/cancel (showFooter).',
    slots: [{ name: 'body', kind: 'popup' }],
    defaultWidth: 7,
    defaultHeight: 4,
  });

  return (
    <LoadingFrame loading={loadingNow} look={<LoadingBox />}>
      <div
        className="ui"
        ref={anchorRef}
        style={{ display: 'flex', alignItems: 'center', ...themeVars({ buttonColor, buttonText }) }}
      >
        <DialogPrimitive.Root
          modal={false}
          open={open}
          onOpenChange={(next) => {
            if (next) show();
            else if (escapeAbove.current) escapeAbove.current = null;
            else close(false);
          }}
        >
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              // n2-btn-fill: the trigger takes its box's height, as the Button does (QA item 9).
              className={cn('ui-btn n2-btn-fill', `ui-btn--${triggerVariant}`)}
              disabled={!!disabled}
            >
              {triggerText}
            </button>
          </DialogPrimitive.Trigger>
          {container ? (
            <DialogPrimitive.Portal container={container}>
              {/* Radix draws its overlay only for a modal dialog. None in the editor: it would cover the panels. */}
              {editing ? null : (
                <div
                  ref={overlayRef}
                  data-state={open ? 'open' : 'closed'}
                  onPointerDown={(e) => {
                    backdropPress.current = e.nativeEvent;
                  }}
                  className="ui-dialog-overlay"
                  style={base === undefined ? undefined : { zIndex: layer }}
                />
              )}
              <DialogPrimitive.Content
                ref={contentRef}
                // The host keeps Tab inside the open dialog (packFocus): it is not Radix's modal mode, which traps.
                data-tj-modal={open ? 'open' : 'closed'}
                className="ui-popup ui-dialog"
                style={{
                  ...themeVars({ bg: background }),
                  borderRadius: radius,
                  ...(base === undefined ? {} : { zIndex: layer + 1 }),
                  [POPUP_LAYER as string]: layer + 2,
                }}
                onPointerDownOutside={editing ? (e) => e.preventDefault() : keepUnlessBackdrop}
                // Focus moving to a field above it (a ToolJet Modal's, another pack's dialog's) is not a dismissal.
                onFocusOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => {
                  if (escapeFromAbove(e)) leaveEscapeToAbove(e);
                }}
              >
                <div>
                  <DialogPrimitive.Title className="ui-dialog-title">{title}</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="ui-dialog-desc">{description}</DialogPrimitive.Description>
                </div>
                {bodyPlace}
                {showFooter ? (
                  <div className="ui-dialog-footer">
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
                  </div>
                ) : null}
                <DialogPrimitive.Close asChild>
                  <button type="button" className="ui-icon-btn ui-dialog-close" aria-label="Close">
                    <X />
                  </button>
                </DialogPrimitive.Close>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          ) : null}
        </DialogPrimitive.Root>
        {bodyKeeper}
      </div>
    </LoadingFrame>
  );
};
