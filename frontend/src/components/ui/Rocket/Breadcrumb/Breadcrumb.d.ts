// Types for Breadcrumb.jsx, which TS can't infer from its untyped forwardRef callbacks.
// Delete this file once Breadcrumb is converted to TypeScript.
import type {
  AnchorHTMLAttributes,
  ForwardRefExoticComponent,
  HTMLAttributes,
  LiHTMLAttributes,
  OlHTMLAttributes,
  RefAttributes,
} from 'react';

export interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
  disabled?: boolean;
}

export declare const Breadcrumb: ForwardRefExoticComponent<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>>;
export declare const BreadcrumbList: ForwardRefExoticComponent<
  OlHTMLAttributes<HTMLOListElement> & RefAttributes<HTMLOListElement>
>;
export declare const BreadcrumbItem: ForwardRefExoticComponent<
  LiHTMLAttributes<HTMLLIElement> & RefAttributes<HTMLLIElement>
>;
export declare const BreadcrumbLink: ForwardRefExoticComponent<BreadcrumbLinkProps & RefAttributes<HTMLAnchorElement>>;
export declare const BreadcrumbPage: ForwardRefExoticComponent<
  HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>
>;
export declare const BreadcrumbSeparator: ForwardRefExoticComponent<
  LiHTMLAttributes<HTMLLIElement> & RefAttributes<HTMLLIElement>
>;
export declare const BreadcrumbEllipsis: ForwardRefExoticComponent<
  HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>
>;

export declare const breadcrumbListClasses: string;
export declare const breadcrumbLinkClasses: string;
export declare const breadcrumbPageClasses: string;
export declare const breadcrumbSeparatorClasses: string;
export declare const breadcrumbEllipsisClasses: string;
