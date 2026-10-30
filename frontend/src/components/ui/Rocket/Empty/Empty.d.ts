// Types for Empty.jsx, which TS can't infer from its untyped forwardRef callbacks.
// Delete this file once Empty is converted to TypeScript.
import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';

type EmptySize = 'large' | 'default' | 'small';
type EmptyMediaVariant = 'default' | 'icon';
type DivComponent<P = object> = ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & P & RefAttributes<HTMLDivElement>
>;

export interface EmptyProps {
  size?: EmptySize;
}

export interface EmptyMediaProps {
  variant?: EmptyMediaVariant;
}

export declare const Empty: DivComponent<EmptyProps>;
export declare const EmptyHeader: DivComponent;
export declare const EmptyMedia: DivComponent<EmptyMediaProps>;
export declare const EmptyTitle: DivComponent;
export declare const EmptyDescription: DivComponent;
export declare const EmptyContent: DivComponent;

export declare function emptyVariants(props?: { size?: EmptySize | null; className?: string }): string;
export declare function emptyMediaVariants(props?: {
  variant?: EmptyMediaVariant | null;
  size?: EmptySize | null;
  className?: string;
}): string;
export declare function emptyTitleVariants(props?: { size?: EmptySize | null; className?: string }): string;
export declare function emptyDescriptionVariants(props?: { size?: EmptySize | null; className?: string }): string;
