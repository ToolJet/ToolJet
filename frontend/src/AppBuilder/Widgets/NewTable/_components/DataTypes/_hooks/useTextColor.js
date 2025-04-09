import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

export default function useTextColor(id, cellTextColor) {
  const textColor = useTableStore((state) => state.getTableStyles(id)?.textColor, shallow);

  if (!cellTextColor || cellTextColor === '#11181C') {
    return textColor;
  }
  return cellTextColor;
}
