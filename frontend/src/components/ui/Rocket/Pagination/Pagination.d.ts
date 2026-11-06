// Types for Pagination.jsx, which TS can't infer from its untyped forwardRef callbacks.
// Delete this file once Pagination is converted to TypeScript.
import type { AnchorHTMLAttributes, ComponentPropsWithoutRef, ForwardRefExoticComponent, RefAttributes } from 'react';

type PaginationSize = 'large' | 'default' | 'small';

export interface PaginationProps extends ComponentPropsWithoutRef<'nav'> {
  size?: PaginationSize;
}

export interface PaginationLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean;
  size?: PaginationSize;
  disabled?: boolean;
}

export interface PaginationNavProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: PaginationSize;
  disabled?: boolean;
}

export interface PaginationEllipsisProps extends ComponentPropsWithoutRef<'span'> {
  size?: PaginationSize;
}

export declare const Pagination: ForwardRefExoticComponent<PaginationProps & RefAttributes<HTMLElement>>;
export declare const PaginationContent: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<'ul'> & RefAttributes<HTMLUListElement>
>;
export declare const PaginationItem: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<'li'> & RefAttributes<HTMLLIElement>
>;
export declare function PaginationLink(props: PaginationLinkProps): JSX.Element;
export declare function PaginationPrevious(props: PaginationNavProps): JSX.Element;
export declare function PaginationNext(props: PaginationNavProps): JSX.Element;
export declare function PaginationEllipsis(props: PaginationEllipsisProps): JSX.Element;

export declare function paginationLinkVariants(props?: { size?: PaginationSize | null; className?: string }): string;
export declare function paginationNavVariants(props?: { size?: PaginationSize | null; className?: string }): string;
export declare function paginationEllipsisVariants(props?: {
  size?: PaginationSize | null;
  className?: string;
}): string;
