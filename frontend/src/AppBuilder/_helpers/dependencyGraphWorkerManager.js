/**
 * Web Worker Manager for Dependency Graph Processing
 * Manages communication with worker to prevent main thread blocking
 */

class DependencyGraphWorkerManager {
  constructor() {
    this.worker = null;
    this.isProcessing = false;
    this.currentResolve = null;
    this.currentReject = null;
  }

  async initWorker() {
    if (this.worker) {
      return; // Already initialized
    }

    try {
      // Create worker from the worker file
      this.worker = new Worker('/src/AppBuilder/_workers/dependencyGraphWorker.js');

      this.worker.onmessage = (e) => {
        this.handleWorkerMessage(e.data);
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        if (this.currentReject) {
          this.currentReject(error);
        }
      };

      console.log('🔧 Dependency graph worker initialized');
    } catch (error) {
      console.warn('Failed to initialize worker:', error);
      throw error;
    }
  }

  handleWorkerMessage(message) {
    const { type, payload } = message;

    switch (type) {
      case 'PROGRESS':
        console.log(`📦 Worker processing batch ${payload.batchNumber}/${payload.totalBatches} (${payload.processed}/${payload.total} components)`);

        // Dispatch progress event
        window.dispatchEvent(new CustomEvent('tooljet-dependency-progress', {
          detail: {
            step: 'Processing Dependencies',
            progress: payload.processed,
            total: payload.total
          }
        }));
        break;

      case 'COMPLETE':
        console.log(`✅ Worker completed processing ${payload.totalProcessed} components`);
        this.isProcessing = false;

        if (this.currentResolve) {
          this.currentResolve(payload.results);
          this.currentResolve = null;
          this.currentReject = null;
        }
        break;

      case 'ERROR':
        console.error('Worker processing error:', payload.error);
        this.isProcessing = false;

        if (this.currentReject) {
          this.currentReject(new Error(payload.error));
          this.currentResolve = null;
          this.currentReject = null;
        }
        break;

      default:
        console.warn('Unknown worker message type:', type);
    }
  }

  async processComponents(components, moduleId, options = {}) {
    if (this.isProcessing) {
      throw new Error('Worker is already processing components');
    }

    await this.initWorker();

    const { batchSize = 10 } = options;

    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;
      this.isProcessing = true;

      // Convert components to serializable format
      const componentEntries = Object.entries(components);

      // Send work to worker
      this.worker.postMessage({
        type: 'PROCESS_COMPONENTS',
        payload: {
          components: componentEntries,
          moduleId,
          batchSize
        }
      });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isProcessing = false;
    this.currentResolve = null;
    this.currentReject = null;
  }
}

// Create singleton instance
const workerManager = new DependencyGraphWorkerManager();

export default workerManager;
