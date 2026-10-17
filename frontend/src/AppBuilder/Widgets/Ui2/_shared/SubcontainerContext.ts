import { useMemo } from 'react';
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

/** The path a widget's own rows (or cards) extend: the enclosing containers' path, or, where the container gives none
 *  (a native Kanban card scopes its children by subContainerIndex only), the widget's own index in it. Without that
 *  index, a List view in card 0 and its own row 0 shared one layout key: the row took the list's height, the list
 *  grew to fit the row, and so on without end. */
export const useOwnContextPath = (subContainerIndex: unknown, containerId = ''): ContextSegment[] => {
  const { contextPath } = useSubcontainerContext();
  return useMemo(
    () =>
      contextPath.length || typeof subContainerIndex !== 'number'
        ? contextPath
        : [{ containerId, index: subContainerIndex }],
    [contextPath, subContainerIndex, containerId]
  );
};
