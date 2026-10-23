import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { themeVars } from '../lib/themeVars';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../lib/usePortalContainer';
import { LoadingBox, LoadingFrame, useLoading } from '../lib/ui2/loading/look';

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

  const show = () => {
    setOpen(true);
    onOpen();
  };
  const close = (confirmed: boolean) => {
    setOpen(false);
    if (confirmed) onConfirm();
    else onCancel();
    onClose();
  };

  ToolJet.useAction({ name: 'open', displayName: 'Open' }, show);
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => {
    setOpen(false);
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
            <button type="button" className={cn('ui-btn', `ui-btn--${triggerVariant}`)}>
              {triggerText}
            </button>
          </DialogPrimitive.Trigger>
          {container ? (
            <DialogPrimitive.Portal container={container}>
              <DialogPrimitive.Overlay className="ui-dialog-overlay" />
              <DialogPrimitive.Content
                className="ui-popup ui-dialog"
                style={{ ...themeVars({ bg: background }), borderRadius: radius }}
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
