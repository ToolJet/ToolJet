// AsyncQueryHandler manages long-running operations via server-sent events (SSE).
export class AsyncQueryHandler {
  /**
   * Creates a new AsyncQueryHandler
   * @param {Object} options - Configuration options
   * @param {Function} options.streamSSE - Function that returns an EventSource for SSE status updates
   * @param {Function} options.extractJobId - Function to extract job ID from response
   * @param {Function} options.classifyEventStatus - Function to classify SSE events into status categories
   * @param {Object} options.callbacks - Event callbacks
   * @param {Function} options.callbacks.onProgress - Progress update handler
   * @param {Function} options.callbacks.onComplete - Completion handler
   * @param {Function} options.callbacks.onError - Error handler
   * @param {Function} options.callbacks.onClose - Close handler
   */
  constructor(options = {}) {
    this.config = {
      streamSSE: () => {},
      extractJobId: (response) => response.data?.id,
      // Default implementation that doesn't make assumptions about specific status/type fields
      classifyEventStatus: (data) => {
        return {
          // Default to treating all messages as progress updates
          status: 'PROGRESS',
          result: data.result || data,
          // Return data for callback handlers
          data,
        };
      },
      callbacks: {
        onProgress: () => {},
        onComplete: () => {},
        onError: () => {},
        onClose: () => {},
      },
      ...options,
    };
    this.eventSource = null;
    this.jobId = null;
  }

  /**
   * Processes the initial query response and starts SSE monitoring
   * @param {Object} response - The initial query response
   * @returns {{ jobId: string, cancel: Function }} Status object with jobId and control methods
   */
  processInitialResponse(response) {
    const jobId = this.config.extractJobId(response);
    if (!jobId) throw new Error('Could not extract job ID for async query');
    this.jobId = jobId;
    this.eventSource = this.startSSE(jobId);

    return { jobId, cancel: () => this.cancel() };
  }

  /**
   * Opens an SSE connection to receive real-time updates for the given job.
   * @private
   * @param {string} jobId - Identifier for the async job
   * @returns {EventSource} SSE event source for updates
   */
  startSSE(jobId) {
    const eventSource = this.config.streamSSE(jobId);
    eventSource.onmessage = (event) => this.handleMessage(event, eventSource);
    eventSource.onerror = (error) => this.handleError(error, eventSource);

    return eventSource;
  }

  /**
   * Processes incoming SSE messages and delegates to the appropriate callback.
   * @private
   * @param {MessageEvent} event - Incoming SSE message
   * @param {EventSource} eventSource - EventSource instance for the SSE connection
   */
  handleMessage(event, eventSource) {
    try {
      const payload = JSON.parse(event.data);
      const { status, result, data } = this.config.classifyEventStatus(payload);

      switch (status) {
        case 'PROGRESS':
          this.config.callbacks.onProgress(data);
          break;
        case 'COMPLETE':
          eventSource.close();
          this.config.callbacks.onComplete(result);
          break;
        case 'ERROR':
          eventSource.close();
          this.config.callbacks.onError(data);
          break;
        case 'CLOSE':
          eventSource.close();
          this.config.callbacks.onClose(data);
          break;
        default:
          this.config.callbacks.onProgress(data);
      }
    } catch (err) {
      console.error('Error parsing SSE message:', err);
      eventSource.close();
      this.config.callbacks.onError({ message: 'Invalid server message', error: err });
    }
  }

  /**
   * Handles SSE connection errors and notifies onError if closed.
   * @private
   * @param {any} error - Error event or object
   * @param {EventSource} eventSource - EventSource instance for the SSE connection
   */
  handleError(error, eventSource) {
    if (eventSource.readyState === EventSource.CLOSED) {
      this.config.callbacks.onError({ message: 'SSE connection closed', error });
    }
  }

  /**
   * Cancels the ongoing async operation and cleans up resources.
   */
  cancel() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    // Notify backend to cancel the job if jobId exists
    // if (this.jobId) {
    //   fetch(`${this.config.endpoint}/${this.jobId}/cancel`, { method: 'POST' }).catch((e) =>
    //     console.error('Failed to cancel async job', e)
    //   );
    // }
  }
}
