/**
 * Compute Worker Entry Point
 */

import * as Comlink from 'comlink';
import { computeEngine } from './ComputeEngine';

console.log('[ComputeWorker] Imports loaded, computeEngine:', computeEngine);
self.postMessage({ type: 'WORKER_IMPORTS_OK' });

// Expose the compute engine via Comlink
Comlink.expose(computeEngine);

console.log('[ComputeWorker] Exposed via Comlink, ready for calls');
self.postMessage({ type: 'WORKER_READY' });
