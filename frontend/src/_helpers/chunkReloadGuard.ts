// A ChunkLoadError after a deploy usually means this tab has an old index.html, and one reload fixes it.
// When the chunk itself can't load (blocked, offline), reloading fails the same way every time, so only
// one automatic reload is allowed per window. The guard is a timestamp rather than a flag cleared on boot:
// the app shell boots before a route's lazy chunk is requested, so clearing on boot re-armed the reload
// on every page load and the tab reloaded forever.

const CHUNK_RELOAD_KEY = 'chunk_reload_at';
export const CHUNK_RELOAD_WINDOW_MS = 60 * 1000;

// True when the caller may reload now; records the reload so the next failure within the window doesn't.
export function claimChunkReload(now: number = Date.now()): boolean {
  try {
    const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY));
    if (lastReloadAt && now - lastReloadAt < CHUNK_RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    return true;
  } catch {
    return false; // storage is unavailable, so a reload loop couldn't be stopped
  }
}
