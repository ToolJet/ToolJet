// Shared by webpack.config.js and rspack.config.js (dev server only — callers gate it).
// Callers must also add WIDGET_DEFINITIONS_SRC to watchOptions.ignored so the bundler's own
// watcher doesn't race this one.
const path = require('path');

const WIDGET_DEFINITIONS_SRC = path.resolve(__dirname, '../../packages/widget-definitions/src');

// In development, when widget-definitions files change the server (NestJS) restarts before
// the bundler should reload. This plugin ignores widget-definitions from the bundler's built-in
// watcher and instead polls /api/config after detecting a change — HMR only fires
// once the server is fully ready (not just the health endpoint, but the actual first API
// call the frontend makes on boot).
class WidgetDefsAfterServerPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('WidgetDefsAfterServerPlugin', () => {
      if (this._watcher) return;
      const chokidar = require('chokidar');
      const http = require('http');

      const serverPort = process.env.TOOLJET_SERVER_PORT || 3000;

      this._watcher = chokidar.watch(WIDGET_DEFINITIONS_SRC, {
        ignoreInitial: true,
      });

      let debounceTimer = null;
      let generation = 0;
      const changedFiles = new Set();
      const removedFiles = new Set();

      // These files are in watchOptions.ignored, so the bundler doesn't know they changed. rspack only
      // rebuilds modules it's told about (a bare invalidate() leaves them cached); webpack has no such
      // method and re-checks file timestamps on invalidate().
      const rebuild = () => {
        const watching = compiler.watching;
        if (typeof watching.invalidateWithChangesAndRemovals === 'function') {
          watching.invalidateWithChangesAndRemovals(new Set(changedFiles), new Set(removedFiles));
        } else {
          watching.invalidate();
        }
        changedFiles.clear();
        removedFiles.clear();
      };

      this._watcher.on('all', (event, filePath) => {
        if (event === 'unlink') {
          removedFiles.add(filePath);
          changedFiles.delete(filePath);
        } else if (event === 'add' || event === 'change') {
          changedFiles.add(filePath);
          removedFiles.delete(filePath);
        } else {
          return;
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const currentGen = ++generation;
          const isStale = () => currentGen !== generation;

          // Phase 0: if server is already mid-restart from a previous save, wait for it to
          // come back up first. Without this, Phase 1 would see it already down and move
          // to Phase 2 too early, triggering HMR before the second save is processed.
          // Timeout after 20s.
          const waitForInitialUp = (attempts = 0) => {
            if (isStale() || attempts > 40) return;
            http
              .get(`http://localhost:${serverPort}/api/config`, (res) => {
                res.resume();
                if (res.statusCode === 200) {
                  waitForDown(0);
                } else {
                  setTimeout(() => waitForInitialUp(attempts + 1), 500);
                }
              })
              .on('error', () => setTimeout(() => waitForInitialUp(attempts + 1), 500));
          };

          // Phase 1: wait for server to go down (nest restart triggered by the file change).
          // After 20s without a restart, the server isn't watching these files, so rebuild anyway.
          const waitForDown = (attempts = 0) => {
            if (isStale()) return;
            if (attempts > 40) return rebuild();
            http
              .get(`http://localhost:${serverPort}/api/config`, (res) => {
                res.resume();
                setTimeout(() => waitForDown(attempts + 1), 500);
              })
              .on('error', () => waitForUp(0));
          };

          // Phase 2: wait for server to come back up, then trigger HMR.
          // Timeout after 30s — if it never recovers, something is wrong, so abort.
          const waitForUp = (attempts = 0) => {
            if (isStale() || attempts > 30) return;
            http
              .get(`http://localhost:${serverPort}/api/config`, (res) => {
                res.resume();
                if (res.statusCode === 200) {
                  rebuild();
                } else {
                  setTimeout(() => waitForUp(attempts + 1), 1000);
                }
              })
              .on('error', () => setTimeout(() => waitForUp(attempts + 1), 1000));
          };

          waitForInitialUp();
        }, 300); // debounce: ignore rapid successive saves
      });
    });
  }
}

module.exports = { WidgetDefsAfterServerPlugin, WIDGET_DEFINITIONS_SRC };
