// In-memory stand-in for the dashboard items API until the backend implements the contract.
// Responses follow `ListResponse` (see `pages/AppsDashboard/dummyData/types.ts`).
import { getDummyListResponse } from '@/pages/AppsDashboard/dummyData';

const MOCK_LATENCY_MS = 700;

function respondAfterLatency(payload, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(payload), MOCK_LATENCY_MS);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Request aborted', 'AbortError'));
    });
  });
}

// Sort and filter params are ignored: the sort/filter toolbar is disabled until the API supports them.
function getRootItems({ page, perPage, searchKey }, { signal } = {}) {
  return respondAfterLatency(getDummyListResponse({ page, perPage, searchKey }), signal);
}

function getFolderItems(folderId, { page, perPage, searchKey }, { signal } = {}) {
  return respondAfterLatency(getDummyListResponse({ folderId, page, perPage, searchKey }), signal);
}

export const mockDashboardItemsApi = { getRootItems, getFolderItems };
