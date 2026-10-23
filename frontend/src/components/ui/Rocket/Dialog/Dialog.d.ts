// Types for Dialog.jsx, which TS can't infer from its untyped forwardRef callbacks.
// Delete this file once Dialog is converted to TypeScript.
import type { FC, ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';
import type {
  DialogCloseProps,
  DialogContentProps as RadixDialogContentProps,
  DialogDescriptionProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
} from '@radix-ui/react-dialog';

type DialogSize = 'small' | 'default' | 'large' | 'extraLarge' | 'fullscreen';

export interface DialogContentProps extends RadixDialogContentProps {
  size?: DialogSize;
  showCloseButton?: boolean;
  /** Blocks closing on overlay click and Escape. */
  preventClose?: boolean;
}

export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  scrollable?: boolean;
}

export declare const Dialog: FC<DialogProps>;
export declare const DialogContent: ForwardRefExoticComponent<DialogContentProps & RefAttributes<HTMLDivElement>>;
export declare const DialogOverlay: ForwardRefExoticComponent<DialogOverlayProps & RefAttributes<HTMLDivElement>>;
export declare const DialogHeader: FC<HTMLAttributes<HTMLDivElement>>;
export declare const DialogBody: ForwardRefExoticComponent<DialogBodyProps & RefAttributes<HTMLDivElement>>;
export declare const DialogFooter: FC<HTMLAttributes<HTMLDivElement>>;
export declare const DialogTitle: ForwardRefExoticComponent<DialogTitleProps & RefAttributes<HTMLHeadingElement>>;
export declare const DialogDescription: ForwardRefExoticComponent<
  DialogDescriptionProps & RefAttributes<HTMLParagraphElement>
>;
export declare const DialogTrigger: ForwardRefExoticComponent<DialogTriggerProps & RefAttributes<HTMLButtonElement>>;
export declare const DialogClose: ForwardRefExoticComponent<DialogCloseProps & RefAttributes<HTMLButtonElement>>;
export declare const DialogPortal: FC<DialogPortalProps>;

export declare function dialogContentVariants(props?: { size?: DialogSize | null; className?: string }): string;

export type { DialogProps };
