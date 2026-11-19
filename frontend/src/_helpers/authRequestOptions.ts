import { authHeader } from './auth-header';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// A function, not a constant: authHeader() reads the current workspace and PAT, so it must run per request.
export function getAuthRequestOptions(method: HttpMethod = 'GET', body?: unknown): RequestInit {
  return {
    method,
    headers: authHeader(),
    credentials: 'include',
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };
}
