import { useCallback, useEffect, useRef, useState } from 'react';
import { openApiSpecService } from '@/_services';

const POLL_INTERVAL_MS = 3000;
const PENDING_STATUSES = ['pending', 'processing'];

// Shared by the datasource config UI (upload widget) and the query editor (to gate the
// operation picker) - polls GET .../openapi-spec/status while a job is pending/processing,
// stops once it settles into ready/failed/cancelled.
export function useOpenApiSpecStatus(dataSourceId, environmentId) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!dataSourceId || !environmentId) return;
    try {
      const result = await openApiSpecService.getStatus(dataSourceId, environmentId);
      setStatus(result?.status || null);
      setError(result?.error || null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch OpenAPI spec status');
    } finally {
      setLoading(false);
    }
  }, [dataSourceId, environmentId]);

  useEffect(() => {
    fetchStatus();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (PENDING_STATUSES.includes(status)) {
      intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, fetchStatus]);

  return {
    status,
    error,
    loading,
    isPending: PENDING_STATUSES.includes(status),
    isReady: status === 'ready',
    isFailed: status === 'failed',
    refetch: fetchStatus,
  };
}
