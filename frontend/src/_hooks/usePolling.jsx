import { useCallback, useEffect, useRef, useState } from 'react';

export const usePolling = (options = {}) => {
  const [status, setStatus] = useState('idle'); // idle, running, success, failed
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const abortControllerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const attemptsRef = useRef(0);
  const isPollingRef = useRef(false);

  const maxAttempts = options.maxAttempts || 120; // 10 minutes with 5s intervals
  const pollInterval = options.pollInterval || 5000; // 5 seconds
  const serviceFn = options.serviceFn;
  const serviceParams = options.serviceParams;

  const checkStatus = useCallback(async () => {
    if (typeof serviceFn !== 'function' || abortControllerRef.current?.signal.aborted) return;

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let response;

      if (serviceParams) {
        const updatedParams = Array.isArray(serviceParams)
          ? [...serviceParams, controller.signal]
          : [serviceParams, controller.signal];

        response = await serviceFn(...updatedParams);
      } else {
        response = await serviceFn();
      }

      // Update build info
      setResult(response);
      attemptsRef.current = 0;

      switch (response.status?.toLowerCase()) {
        case 'building':
        case 'in_progress':
        case 'running':
          setStatus('running');
          return false; // Continue polling

        case 'completed':
        case 'success':
        case 'done':
        case 'ready':
          setStatus('success');
          return true; // Stop polling

        case 'failed':
        case 'error':
          setStatus('failed');
          setError(response.error || 'An unknown error occurred');
          return true; // Stop polling

        default:
          return false; // Continue polling
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return true; // Stop polling on abort
      }

      attemptsRef.current++;

      if (attemptsRef.current >= maxAttempts) {
        setStatus('failed');
        setError('Max polling attempts reached');
        return true; // Stop polling on reaching limit
      }

      return false; // Continue polling
    }
  }, [serviceFn, serviceParams, maxAttempts]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;

    isPollingRef.current = true;
    setStatus('running');
    setError(null);
    attemptsRef.current = 0;

    const poll = async () => {
      const shouldStop = await checkStatus();

      if (shouldStop || !isPollingRef.current) {
        isPollingRef.current = false;
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
        }
        return;
      }

      // Schedule next poll with exponential backoff on errors
      const delay =
        attemptsRef.current > 0
          ? Math.min(pollInterval * Math.pow(2, attemptsRef.current), 60000) // Cap at 60 seconds
          : pollInterval;

      pollIntervalRef.current = setTimeout(poll, delay);
    };

    poll();
  }, [checkStatus, pollInterval]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    status,
    error,
    result,
    startPolling,
    stopPolling,
  };
};
