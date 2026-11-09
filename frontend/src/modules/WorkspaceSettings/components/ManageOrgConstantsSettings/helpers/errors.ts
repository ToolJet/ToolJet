import { FALLBACK_ERROR } from './constants';

// What `handleResponse` rejects with: the parsed error body, with the HTTP status added.
export interface ApiError {
  error?: string;
  statusCode?: number;
}

const isApiError = (value: unknown): value is ApiError => typeof value === 'object' && value !== null;

export const getErrorMessage = (err: unknown, fallback: string = FALLBACK_ERROR): string =>
  (isApiError(err) && err.error) || fallback;

export const getStatusCode = (err: unknown): number | undefined => (isApiError(err) ? err.statusCode : undefined);
