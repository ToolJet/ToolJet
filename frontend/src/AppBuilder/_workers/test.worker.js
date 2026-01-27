/**
 * Minimal test worker to verify worker setup
 */

self.postMessage({ type: 'TEST_WORKER_START' });
console.log('[TestWorker] Worker script starting...');

// Simple test - just respond to messages
self.onmessage = (event) => {
  console.log('[TestWorker] Received message:', event.data);
  self.postMessage({ type: 'ECHO', data: event.data });
};

self.postMessage({ type: 'TEST_WORKER_READY' });
console.log('[TestWorker] Worker ready');
