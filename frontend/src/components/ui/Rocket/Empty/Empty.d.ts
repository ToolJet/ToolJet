import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';

type EmptySize = 'large' | 'default' | 'small';
type Section = ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;

export interface EmptyProps extends HTMLAttributes<HTMLDivElement> {
  size?: EmptySize;
}
export interface EmptyMediaProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'icon';
}

export const Empty: ForwardRefExoticComponent<EmptyProps & RefAttributes<HTMLDivElement>>;
export const EmptyHeader: Section;
export const EmptyMedia: ForwardRefExoticComponent<EmptyMediaProps & RefAttributes<HTMLDivElement>>;
export const EmptyTitle: Section;
export const EmptyDescription: Section;
export const EmptyContent: Section;

export function emptyVariants(props?: { size?: EmptySize; className?: string }): string;
export function emptyMediaVariants(props?: { variant?: 'default' | 'icon'; className?: string }): string;
export function emptyTitleVariants(props?: { size?: EmptySize; className?: string }): string;
export function emptyDescriptionVariants(props?: { size?: EmptySize; className?: string }): string;
