import { getTableComponentId } from '../../../_utils/tableStoreKey';

export default function useValidationStyle(id, row, validationError) {
  if (validationError) {
    const elem = document.getElementById(getTableComponentId(id))?.querySelector(`[data-index="${row.index}"]`);
    if (elem) {
      elem.style.maxHeight = '';
      elem.style.height = '';
    }
  }
  return null;
}
