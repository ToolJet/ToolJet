import type {
  ComponentPropsWithoutRef,
  ElementRef,
  ForwardRefExoticComponent,
  HTMLAttributes,
  RefAttributes,
} from 'react';
import type * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

type Forwarded<T extends React.ElementType, Extra = object> = ForwardRefExoticComponent<
  ComponentPropsWithoutRef<T> & Extra & RefAttributes<ElementRef<T>>
>;

export const AlertDialog: typeof AlertDialogPrimitive.Root;
export const AlertDialogTrigger: typeof AlertDialogPrimitive.Trigger;
export const AlertDialogOverlay: Forwarded<typeof AlertDialogPrimitive.Overlay>;
export const AlertDialogContent: Forwarded<
  typeof AlertDialogPrimitive.Content,
  { size?: 'default' | 'small'; preventClose?: boolean }
>;
export function AlertDialogMedia(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export function AlertDialogHeader(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export const AlertDialogTitle: Forwarded<typeof AlertDialogPrimitive.Title>;
export const AlertDialogDescription: Forwarded<typeof AlertDialogPrimitive.Description>;
export function AlertDialogFooter(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export const AlertDialogAction: Forwarded<typeof AlertDialogPrimitive.Action>;
export const AlertDialogCancel: Forwarded<typeof AlertDialogPrimitive.Cancel>;
