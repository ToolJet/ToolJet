// Types for ListFooter.jsx, which TS can't infer from its untyped JS.
// Delete this file once ListFooter is converted to TypeScript.
import type { ReactElement } from 'react';

export const FOOTER_CLASS: string;

export interface ListFooterMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page?: number;
}

export interface ListFooterProps {
  /** Defaults to the root list's meta. */
  meta?: ListFooterMeta | null;
  /** Plural noun in "Showing 1-50 of 120 {itemLabel}". Defaults to "items". */
  itemLabel?: string;
}

export default function ListFooter(props: ListFooterProps): ReactElement | null;
