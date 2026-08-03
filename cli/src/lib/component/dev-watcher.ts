import * as chokidar from 'chokidar';
import * as path from 'path';

import { build, BuildResult } from './builder';

interface WatcherOptions {
  projectRoot: string;
  debounceMs: number;
  onRebuild: (result: BuildResult | { error: Error }) => Promise<void>;
}

export class DevWatcher {
  static start({ projectRoot, debounceMs, onRebuild }: WatcherOptions): () => void {
    let debounceTimer: NodeJS.Timeout;

    const watcher = chokidar.watch(path.join(projectRoot, 'src'), {
      ignored: /(^|[/\\])\../,   // ignore dotfiles
      persistent: true,
      ignoreInitial: false,            // trigger on first watch to do initial build
      awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 50 },
    });

    watcher.on('all', (_event, filePath) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${path.relative(projectRoot, filePath)} changed`);

        try {
          const result = await build(projectRoot);
          await onRebuild(result);
        } catch (err) {
          await onRebuild({ error: err as Error });
        }
      }, debounceMs);
    });

    return () => watcher.close();
  }
}