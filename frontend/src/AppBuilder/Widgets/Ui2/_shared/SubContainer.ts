import type { ComponentType, CSSProperties } from 'react';
import { Container } from '@/AppBuilder/AppCanvas/Container';

/** The props AppCanvas/Container reads: a canvas of child components inside a container widget. */
export interface SubContainerProps {
  /** The canvas id (a widget's id, or `<id>-<tab id>` for a tab). */
  id: string;
  canvasWidth: number;
  canvasHeight: number | string;
  /** The row or card the canvas renders, for per-row children (null for a single canvas). */
  index?: number | null;
  onOptionChange?: ((...args: unknown[]) => void) | null;
  onOptionsChange?: ((...args: unknown[]) => void) | null;
  allowContainerSelect?: boolean;
  styles?: CSSProperties;
  listViewMode?: string;
  columns?: number;
  darkMode?: boolean;
  canvasMaxWidth?: number;
  componentType?: string;
  appType?: string;
  hasNoScroll?: boolean;
  flexEffectiveDirection?: string;
  flexShouldStack?: boolean;
}

// Container.jsx is JavaScript (React.memo of untyped props), so TypeScript sees no props: this gives them a type.
export const SubContainer = Container as ComponentType<SubContainerProps>;
