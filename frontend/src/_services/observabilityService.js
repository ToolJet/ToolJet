import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const observabilityService = {
  getMetrics: (params = {}) => {
    // Filter out undefined / null values so URLSearchParams doesn't stringify them as "undefined"
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== 'All')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
    return fetch(`${config.apiUrl}/observability/metrics?${query}`, requestOptions).then(handleResponse);
  },
};
