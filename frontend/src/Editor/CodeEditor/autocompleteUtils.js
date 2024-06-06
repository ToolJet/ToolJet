export function getLastSubstring(inputString) {
  if (!inputString.includes('.')) return '';

  let parts = inputString.trim().split('.').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

export function getLastDepth(inputString) {
  let parts = inputString.split('.').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}
