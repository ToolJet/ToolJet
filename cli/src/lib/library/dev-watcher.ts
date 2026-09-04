import * as chokidar from 'chokidar';
import * as path from 'path';

import { build, BuildResult } from './builder';

interface WatcherOptions {
  projectRoot: string;
  debounceMs: number;
  onRebuild: (result: BuildResult | { error: Error }) => Promise<void>;
}

export class DevWatcher {
  static start({ projectRoot, debounceMs, onRebuild }: WatcherOptions): { stop: () => Promise<void> } {
    let debounceTimer: NodeJS.Timeout;
    let isRunning = false;
    let pendingRerun = false;
    let stopping = false;
    let currentRun: Promise<void> = Promise.resolve();

    let pendingLabel = '';

    const watcher = chokidar.watch(path.join(projectRoot, 'src'), {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
      // Initial build is triggered explicitly on 'ready' below (with its own label) instead of
      // relying on chokidar's per-file 'add' events for the startup scan — otherwise every
      // pre-existing file fires through the same path as a real edit and misleadingly logs as
      // "<some file> changed" even though nothing was touched.
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 50 },
    });

    // Runs are never allowed to overlap: a save that arrives while one is in flight just
    // flags pendingRerun instead of starting a second run. build() always rebuilds from the
    // current src/ state, so one trailing run after the busy period covers everything that
    // piled up — this keeps upload order correct and never drops the last edit in a burst.
    const runBuild = async (label: string): Promise<void> => {
      isRunning = true;
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ${label}`);

      try {
        const result = await build(projectRoot);
        await onRebuild(result);
      } catch (err) {
        try {
          await onRebuild({ error: err as Error });
        } catch (reportErr) {
          // onRebuild is caller-supplied — if even its error path throws, don't let it
          // become an unhandled rejection that kills the whole watch process.
          console.error('onRebuild error handler itself failed:', reportErr);
        }
      } finally {
        isRunning = false;
      }

      if (pendingRerun && !stopping) {
        pendingRerun = false;
        await runBuild(pendingLabel);
      }
    };

    const schedule = (label: string) => {
      if (stopping) return;
      pendingLabel = label;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (stopping) return;
        if (isRunning) {
          pendingRerun = true;
          return;
        }
        currentRun = runBuild(label);
      }, debounceMs);
    };

    watcher.on('ready', () => schedule('Building initial version...'));

    watcher.on('all', (_event, filePath) => {
      schedule(`${path.relative(projectRoot, filePath)} changed`);
    });

    return {
      stop: async () => {
        stopping = true;
        clearTimeout(debounceTimer);
        await watcher.close(); // Stop watching for new changes
        await currentRun; // let any in-flight build+upload finish before resolving
      },
    };
  }
}
