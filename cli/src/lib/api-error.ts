// API errors come back as JSON bodies like
// {"statusCode":401,"timestamp":"...","path":"...","message":"Invalid CLI token"}.
// Surface just the `message` field to the user instead of dumping the raw body.
export function parseApiErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed.message === 'string') return parsed.message;
  } catch {
    // Not JSON — fall through to the raw body.
  }

  return body || `Request failed with status ${status}`;
}
