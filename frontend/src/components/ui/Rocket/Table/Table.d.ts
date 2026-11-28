import type {
  ForwardRefExoticComponent,
  HTMLAttributes,
  RefAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  TableHTMLAttributes,
} from 'react';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  density?: 'default' | 'compact';
}

export const Table: ForwardRefExoticComponent<TableProps & RefAttributes<HTMLTableElement>>;
export const TableHeader: ForwardRefExoticComponent<
  HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>
>;
export const TableBody: ForwardRefExoticComponent<
  HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>
>;
export const TableFooter: ForwardRefExoticComponent<
  HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>
>;
export const TableRow: ForwardRefExoticComponent<
  HTMLAttributes<HTMLTableRowElement> & RefAttributes<HTMLTableRowElement>
>;
export const TableHead: ForwardRefExoticComponent<
  ThHTMLAttributes<HTMLTableCellElement> & RefAttributes<HTMLTableCellElement>
>;
export const TableCell: ForwardRefExoticComponent<
  TdHTMLAttributes<HTMLTableCellElement> & RefAttributes<HTMLTableCellElement>
>;
export const TableCaption: ForwardRefExoticComponent<
  HTMLAttributes<HTMLTableCaptionElement> & RefAttributes<HTMLTableCaptionElement>
>;
