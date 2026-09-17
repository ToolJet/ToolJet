const timeoutIds = new Set();
const intervalIds = new Set();
const rafIds = new Set();

export const timerRegistry = {
  trackedSetTimeout(fn, delay, ...args) {
    const id = window.setTimeout(fn, delay, ...args);
    timeoutIds.add(id);
    return id;
  },
  trackedSetInterval(fn, delay, ...args) {
    const id = window.setInterval(fn, delay, ...args);
    intervalIds.add(id);
    return id;
  },
  trackedRequestAnimationFrame(fn) {
    const id = window.requestAnimationFrame(fn);
    rafIds.add(id);
    return id;
  },
  trackedClearTimeout(id) {
    timeoutIds.delete(id);
    window.clearTimeout(id);
  },
  trackedClearInterval(id) {
    intervalIds.delete(id);
    window.clearInterval(id);
  },
  trackedCancelAnimationFrame(id) {
    rafIds.delete(id);
    window.cancelAnimationFrame(id);
  },
  clearAll() {
    timeoutIds.forEach((id) => window.clearTimeout(id));
    intervalIds.forEach((id) => window.clearInterval(id));
    rafIds.forEach((id) => window.cancelAnimationFrame(id));
    timeoutIds.clear();
    intervalIds.clear();
    rafIds.clear();
  },
};
