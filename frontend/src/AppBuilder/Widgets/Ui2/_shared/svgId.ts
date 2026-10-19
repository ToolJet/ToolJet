import { useId } from 'react';

/** An id for an SVG definition (a gradient) that a fill names with url(#id). SVG ids are document-wide and a component
 *  id repeats in List view and Kanban rows, so an id built from it drew every row's fill with the first row's gradient
 *  (its colour). One per rendered instance; React's colons are dropped, as url() references read them badly. */
export const useSvgId = (prefix: string): string => `${prefix}-${useId().replace(/[^\w-]/g, '')}`;
