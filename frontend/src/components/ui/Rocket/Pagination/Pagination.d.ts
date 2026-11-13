import type {
  AnchorHTMLAttributes,
  ForwardRefExoticComponent,
  HTMLAttributes,
  LiHTMLAttributes,
  RefAttributes,
} from 'react';

type PaginationSize = 'large' | 'default' | 'small';

export interface PaginationLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean;
  size?: PaginationSize;
  disabled?: boolean;
}

export const Pagination: ForwardRefExoticComponent<
  HTMLAttributes<HTMLElement> & { size?: PaginationSize } & RefAttributes<HTMLElement>
>;
export const PaginationContent: ForwardRefExoticComponent<
  HTMLAttributes<HTMLUListElement> & RefAttributes<HTMLUListElement>
>;
export const PaginationItem: ForwardRefExoticComponent<LiHTMLAttributes<HTMLLIElement> & RefAttributes<HTMLLIElement>>;
export function PaginationLink(props: PaginationLinkProps): JSX.Element;
export function PaginationPrevious(props: Omit<PaginationLinkProps, 'isActive'>): JSX.Element;
export function PaginationNext(props: Omit<PaginationLinkProps, 'isActive'>): JSX.Element;
export function PaginationEllipsis(props: HTMLAttributes<HTMLSpanElement> & { size?: PaginationSize }): JSX.Element;

export function paginationLinkVariants(props?: { size?: PaginationSize; className?: string }): string;
export function paginationNavVariants(props?: { size?: PaginationSize; className?: string }): string;
export function paginationEllipsisVariants(props?: { size?: PaginationSize; className?: string }): string;
