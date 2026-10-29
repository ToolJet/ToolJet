// Plain HTTP is only safe to allow for loopback hosts (local ToolJet dev instances) —
// anything else would send the bearer API token over an unencrypted connection.
export function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

// Returns true if valid, or an error message otherwise — matches inquirer's `validate` contract
// so the same function drives both the interactive prompt (login) and flag validation (dev/deploy).
export function validateOriginUrl(input: string): string | true {
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return 'Enter a valid URL, including the protocol (e.g. https://app.tooljet.ai)';
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'Enter a valid URL, including the protocol (e.g. https://app.tooljet.ai)';
  }

  if (parsed.protocol === 'http:' && !isLoopbackHost(parsed.hostname)) {
    return 'HTTP is only allowed for localhost/127.0.0.1 — use https:// for remote ToolJet instances';
  }

  return true;
}

export function validateApiToken(input: string): string | true {
  return (input && input.trim().length > 0) || 'API token is required';
}
