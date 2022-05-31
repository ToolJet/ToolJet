import { GoogleAuth } from 'google-auth-library';
import { URL } from 'url';
import LRU from 'lru-cache';

const auth = new GoogleAuth();

const options = {
  max: 50,
  ttl: 1000 * 60 * 59, // 1 hour
};

const cache = new LRU(options);

export const GCPIdToken = async (url: string) => {
  // Use the request URL hostname as the target audience for requests.
  const targetAudience = new URL(url).origin;

  if (cache.get(targetAudience)) {
    return String(cache.get(targetAudience));
  }

  console.info(`request ${url} with target audience ${targetAudience}`);

  const client = await auth.getIdTokenClient(targetAudience);
  const { Authorization } = await client.getRequestHeaders();

  cache.set(targetAudience, Authorization);

  return Authorization;
};
