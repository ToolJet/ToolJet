export default function useValidationStyle(id, row, validationError) {
  if (validationError) {
    const elem = document.getElementById(id)?.querySelector(`[data-index="${row.index}"]`);
    if (elem) {
      elem.style.maxHeight = '';
      elem.style.height = '';
    }
  }
  return null;
}
