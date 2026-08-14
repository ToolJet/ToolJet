export const FULLSCREEN_CHANGE_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange',
];

export function getFullscreenElement(doc = document) {
  return (
    doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || null
  );
}

export function isNativeFullscreenEnabled(doc = document) {
  if (typeof doc.fullscreenEnabled === 'boolean') return doc.fullscreenEnabled;
  if (typeof doc.webkitFullscreenEnabled === 'boolean') return doc.webkitFullscreenEnabled;
  if (typeof doc.mozFullScreenEnabled === 'boolean') return doc.mozFullScreenEnabled;
  return false;
}

export function getRequestFullscreen(element) {
  return (
    element?.requestFullscreen ||
    element?.webkitRequestFullscreen ||
    element?.webkitRequestFullScreen ||
    element?.mozRequestFullScreen ||
    element?.msRequestFullscreen ||
    null
  );
}

export function getExitFullscreen(doc = document) {
  return (
    doc.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.webkitCancelFullScreen ||
    doc.mozCancelFullScreen ||
    doc.msExitFullscreen ||
    null
  );
}

export function shouldUseCssFullscreenFallback(doc = document) {
  return !isNativeFullscreenEnabled(doc);
}

export async function enterNativeFullscreen(element) {
  const request = getRequestFullscreen(element);
  if (!request) return false;
  await request.call(element);
  return true;
}

export async function exitNativeFullscreen(doc = document) {
  const exit = getExitFullscreen(doc);
  if (!exit) return false;
  await exit.call(doc);
  return true;
}

export async function toggleNativeFullscreen(element, doc = document) {
  if (!element) return false;
  if (getFullscreenElement(doc) === element) {
    return exitNativeFullscreen(doc);
  }
  return enterNativeFullscreen(element);
}
