import type {
  ComponentPropsWithoutRef,
  ElementRef,
  ForwardRefExoticComponent,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
} from 'react';
import type * as DialogPrimitive from '@radix-ui/react-dialog';

type DialogSize = 'small' | 'default' | 'large' | 'extraLarge' | 'fullscreen';

export interface DialogContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize;
  showCloseButton?: boolean;
  preventClose?: boolean;
  'data-cy'?: string;
}

export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  scrollable?: boolean;
  children?: ReactNode;
}

export const Dialog: typeof DialogPrimitive.Root;
export const DialogTrigger: typeof DialogPrimitive.Trigger;
export const DialogClose: typeof DialogPrimitive.Close;
export const DialogPortal: typeof DialogPrimitive.Portal;
export const DialogOverlay: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & RefAttributes<ElementRef<typeof DialogPrimitive.Overlay>>
>;
export const DialogContent: ForwardRefExoticComponent<
  DialogContentProps & RefAttributes<ElementRef<typeof DialogPrimitive.Content>>
>;
export function DialogHeader(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export const DialogBody: ForwardRefExoticComponent<DialogBodyProps & RefAttributes<HTMLDivElement>>;
export function DialogFooter(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export const DialogTitle: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & RefAttributes<ElementRef<typeof DialogPrimitive.Title>>
>;
export const DialogDescription: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description> &
    RefAttributes<ElementRef<typeof DialogPrimitive.Description>>
>;
export function dialogContentVariants(props?: { size?: DialogSize; className?: string }): string;
