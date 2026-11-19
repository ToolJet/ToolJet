import { dataTypes } from '../constants';

/** A column as the page holds it: `Header` is the column name. */
export interface TableColumn {
  Header: string;
  accessor?: string;
  dataType: string;
  constraints_type?: unknown;
  column_default?: string | null;
}

interface FormColumn {
  column_name: string;
  data_type: string;
}

interface FormColumnDetails extends FormColumn {
  constraints_type: unknown;
  dataTypeDetails: unknown[] | null;
  column_default: string | null | undefined;
}

export interface EditTableFormData {
  selectedColumns: Record<number, FormColumn>;
  selectedTableData: Record<number, FormColumnDetails>;
}

// The Edit table form wants its columns in two shapes: a plain name/type map by position, and a richer map that adds
// the editor's data type details, constraints and default.
export function buildEditTableFormData(columns: TableColumn[]): EditTableFormData {
  const selectedColumns: EditTableFormData['selectedColumns'] = {};
  const selectedTableData: EditTableFormData['selectedTableData'] = {};

  columns.forEach((column, index) => {
    selectedColumns[index] = { column_name: column.Header, data_type: column.dataType };

    const dataTypeDetails = dataTypes.filter((dataType) => dataType.value === column.dataType);
    selectedTableData[index] = {
      column_name: column.Header,
      data_type: column.dataType,
      constraints_type: column.constraints_type,
      dataTypeDetails: dataTypeDetails.length > 0 ? dataTypeDetails : null,
      column_default: column.column_default,
    };
  });

  return { selectedColumns, selectedTableData };
}
