import React from 'react';
import { CircularProgress, Skeleton, Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import type { FieldSize, TextFieldVariant } from './field';

// The pack draws MUI's own loading looks (pack.json "loading": "own", so the host draws no overlay): a component with a
// loading prop or state uses it (Button, Menu and Dialog triggers, Autocomplete, DataGrid, an indeterminate
// LinearProgress); the rest wrap their content in <Loading>, which keeps it mounted and in place (hidden, so the box
// keeps its size and the content comes back as it was) and draws MUI's Skeleton or a CircularProgress over it. The
// charts take a Skeleton too: x-charts' own loading prop writes "Loading data..." over the drawn series.

export const Loading = ({
  loading,
  look,
  fill = false,
  className,
  children,
}: {
  loading: boolean;
  look: React.ReactNode;
  fill?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={['tj-mui-loading', fill ? 'tj-mui-loading--fill' : '', loading ? 'tj-mui-loading--on' : '', className ?? ''].join(' ').trim()}
    aria-busy={loading || undefined}
  >
    <div className="tj-mui-loading__content">{children}</div>
    {loading ? <div className="tj-mui-loading__look">{look}</div> : null}
  </div>
);

// MUI's TextField heights: outlined and filled 56px (small 40px), standard 48px (small 45px, label included); a
// multiline field adds 23px a row past the first.
const fieldHeight = (variant: TextFieldVariant, size: FieldSize, rows = 1) =>
  (variant === 'standard' ? (size === 'small' ? 45 : 48) : size === 'small' ? 40 : 56) + 23 * (rows - 1);

/** A rounded Skeleton at the field's own size, where the TextField (or Select, picker) sits. */
export const FieldSkeleton = ({ variant, size, rows }: { variant: TextFieldVariant; size: FieldSize; rows?: number }) => (
  <Skeleton variant="rounded" width="100%" height={fieldHeight(variant, size, rows)} />
);

/** MUI's CircularProgress, centred in the box (shrunk only when the box is shorter than its 40px). */
export const Spinner = () => (
  <div className="tj-mui-loading__center">
    <CircularProgress className="tj-mui-loading__spinner" />
  </div>
);

/** Skeleton text lines at a Typography variant's size, the last one shorter. */
export const TextSkeleton = ({ variant, lines = 1 }: { variant: TypographyProps['variant']; lines?: number }) => (
  <>
    {Array.from({ length: lines }, (_, i) => (
      <Typography key={i} variant={variant}>
        <Skeleton width={i === lines - 1 ? '60%' : '100%'} />
      </Typography>
    ))}
  </>
);

/** A Skeleton filling the box: rectangular for cards, rounded for blocks with MUI's shape (Alert). */
export const BlockSkeleton = ({ variant = 'rectangular' }: { variant?: 'rectangular' | 'rounded' }) => (
  <Skeleton variant={variant} width="100%" height="100%" />
);
