// ─────────────────────────────────────────────────────────────────────────────
// Work queue for one engine pass.
//
// Heights flow outwards: a widget's height decides where its siblings go,
// which decides its container's height, which decides where the container's
// siblings go, and so on up to the canvas. So work is grouped by level (the
// engine gives deeper work a higher level) and the highest level runs first:
// by the time a container is sized, everything inside it already is.
//
// Running work only ever adds work at the same level or lower (outwards),
// which keeps a single sweep from top level to 0 complete. Adding above the
// running level would never run, so it throws rather than being lost.
// ─────────────────────────────────────────────────────────────────────────────

export const createWorkQueue = () => {
  const levels = []; // level → items, in the order they were added
  const added = new Set(); // keys ever added: each key runs once per pass
  let running = null; // the level being drained, null outside drain()

  const add = (level, key, item) => {
    if (!Number.isInteger(level) || level < 0) throw new Error(`dynamic height: ${key} has no valid level`);
    if (added.has(key)) return;
    if (running !== null && level > running) {
      throw new Error(`dynamic height: ${key} added at level ${level} while level ${running} is running`);
    }
    added.add(key);
    (levels[level] ??= []).push(item);
  };

  // Runs every item, highest level first. Items added to the running level
  // while it drains are picked up by the same loop (`for...of` reads the
  // array's length on every step). Afterwards the queue is empty again; keys
  // that ran stay spent.
  const drain = (run) => {
    for (running = levels.length - 1; running >= 0; running--) {
      for (const item of levels[running] ?? []) run(item);
    }
    levels.length = 0;
    running = null;
  };

  return { add, drain };
};
