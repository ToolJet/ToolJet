import { useTableCellSettings } from '../../TableData/TableCellSettings';

export default function useTextColor(id, cellTextColor) {
  const { textColor } = useTableCellSettings(id);

  if (!cellTextColor || cellTextColor === '#11181C') {
    return textColor;
  }
  return cellTextColor;
}
