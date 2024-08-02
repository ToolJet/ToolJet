export function reservedKeywordReplacer(key, value) {
  if ([window, window.app, document].includes(value)) {
    return {};
  }
  return value;
}
