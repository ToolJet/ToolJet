import type { Context } from 'react';
import SubcontainerContextJs, {
  useSubcontainerContext as useSubcontainerContextJs,
} from '@/AppBuilder/_contexts/SubcontainerContext';

/** One container a component sits in: the container's id and the row (or card) of it the component renders in. */
export interface ContextSegment {
  containerId: string;
  index: number;
}

export interface SubcontainerContextValue {
  contextPath: ContextSegment[];
}

// SubcontainerContext.jsx is JavaScript (created with an empty path), so TypeScript reads the path as never[]: this
// gives the context its type.
export const SubcontainerContext = SubcontainerContextJs as unknown as Context<SubcontainerContextValue>;
export const useSubcontainerContext = useSubcontainerContextJs as () => SubcontainerContextValue;
