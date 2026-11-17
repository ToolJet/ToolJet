import type { TjdbTable } from '../TooljetDatabaseContext';

export interface TableFormProps {
  /** Present for Edit table, absent for Create table. */
  selectedTable?: Partial<TjdbTable>;
  /** Create table: the starting columns. */
  selectedColumns?: Record<number, unknown>;
  /** Edit table: the table's columns with their data type details. */
  selectedTableData?: Record<number, unknown>;
  onCreate?: (table: TjdbTable) => void;
  /** Called with the table's (possibly new) name after a saved edit. */
  onEdit?: (tableName: string) => void;
  onClose: () => void;
  updateSelectedTable?: (table: TjdbTable) => void;
  initiator: 'CreateTableForm' | 'EditTableForm';
}

declare const TableForm: (props: TableFormProps) => JSX.Element;
export default TableForm;
