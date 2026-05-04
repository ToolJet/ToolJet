import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbList as ShadcnBreadcrumbList,
  BreadcrumbItem as ShadcnBreadcrumbItem,
  BreadcrumbLink as ShadcnBreadcrumbLink,
  BreadcrumbPage as ShadcnBreadcrumbPage,
  BreadcrumbSeparator as ShadcnBreadcrumbSeparator,
  BreadcrumbEllipsis as ShadcnBreadcrumbEllipsis,
} from '@/components/ui/Rocket/shadcn/breadcrumb';

// ── Re-exports (structural, no visual tokens to override) ─────────────────
const Breadcrumb = ShadcnBreadcrumb;
const BreadcrumbItem = ShadcnBreadcrumbItem;

// ── BreadcrumbList ────────────────────────────────────────────────────────
const breadcrumbListClasses = [
  'tw-flex tw-list-none tw-flex-wrap tw-items-center tw-gap-1.5',
  'tw-font-body-small',
].join(' ');

const BreadcrumbList = forwardRef(function BreadcrumbList({ className, ...props }, ref) {
  return <ShadcnBreadcrumbList ref={ref} className={cn(breadcrumbListClasses, className)} {...props} />;
});
BreadcrumbList.displayName = 'BreadcrumbList';

BreadcrumbList.propTypes = {
  className: PropTypes.string,
};

// ── BreadcrumbLink ────────────────────────────────────────────────────────
const breadcrumbLinkClasses = [
  'tw-text-text-placeholder tw-no-underline',
  'tw-transition-colors',
  'hover:tw-text-text-default hover:tw-no-underline',
].join(' ');

const breadcrumbLinkDisabledClasses = ['tw-text-text-disabled tw-pointer-events-none tw-cursor-not-allowed'].join(' ');

const BreadcrumbLink = forwardRef(function BreadcrumbLink({ className, disabled = false, ...props }, ref) {
  return (
    <ShadcnBreadcrumbLink
      ref={ref}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(breadcrumbLinkClasses, disabled && breadcrumbLinkDisabledClasses, className)}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

BreadcrumbLink.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  asChild: PropTypes.bool,
};

// ── BreadcrumbPage ────────────────────────────────────────────────────────
const breadcrumbPageClasses = ['tw-text-text-default tw-font-title-small'].join(' ');

const BreadcrumbPage = forwardRef(function BreadcrumbPage({ className, ...props }, ref) {
  return <ShadcnBreadcrumbPage ref={ref} className={cn(breadcrumbPageClasses, className)} {...props} />;
});
BreadcrumbPage.displayName = 'BreadcrumbPage';

BreadcrumbPage.propTypes = {
  className: PropTypes.string,
};

// ── BreadcrumbSeparator ───────────────────────────────────────────────────
const breadcrumbSeparatorClasses = ['tw-text-icon-default tw-contents [&>svg]:tw-size-3.5'].join(' ');

const BreadcrumbSeparator = forwardRef(function BreadcrumbSeparator({ className, ...props }, ref) {
  return <ShadcnBreadcrumbSeparator ref={ref} className={cn(breadcrumbSeparatorClasses, className)} {...props} />;
});
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

BreadcrumbSeparator.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── BreadcrumbEllipsis ────────────────────────────────────────────────────
const breadcrumbEllipsisClasses = [
  'tw-flex tw-size-6 tw-items-center tw-justify-center',
  'tw-rounded tw-text-icon-default',
  'tw-transition-colors',
  'hover:tw-bg-interactive-hover',
  '[&>svg]:tw-size-4',
].join(' ');

const BreadcrumbEllipsis = forwardRef(function BreadcrumbEllipsis({ className, ...props }, ref) {
  return <ShadcnBreadcrumbEllipsis ref={ref} className={cn(breadcrumbEllipsisClasses, className)} {...props} />;
});
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

BreadcrumbEllipsis.propTypes = {
  className: PropTypes.string,
};

// ── Exports ──────────────────────────────────────────────────────────────
export {
  Breadcrumb,
  BreadcrumbList,
  breadcrumbListClasses,
  BreadcrumbItem,
  BreadcrumbLink,
  breadcrumbLinkClasses,
  BreadcrumbPage,
  breadcrumbPageClasses,
  BreadcrumbSeparator,
  breadcrumbSeparatorClasses,
  BreadcrumbEllipsis,
  breadcrumbEllipsisClasses,
};
