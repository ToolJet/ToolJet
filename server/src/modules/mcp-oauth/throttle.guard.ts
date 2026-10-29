import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpOAuthService } from './service';
import { hash, OAuthFailure } from './protocol';
import * as proxyaddr from 'proxy-addr';
import * as ipaddr from 'ipaddr.js';

export function oauthAddressBucket(address: string): string {
  const ip = ipaddr.process(address);
  if (ip.kind() === 'ipv4') return ip.toString();
  // IPv6 privacy addresses in one /64 share an anonymous budget.
  return (
    (ip as ipaddr.IPv6).parts
      .slice(0, 4)
      .map((part: number) => part.toString(16))
      .join(':') + '::/64'
  );
}

/** Fixed-size, per-replica admission windows. Anonymous traffic cannot evict grant buckets. */
export class OAuthRateWindows {
  private anonymous = new Map<string, { count: number; until: number }>();
  private authenticated = new Map<string, { count: number; until: number }>();
  private nextSweep = 0;
  take(key: string, limit: number, authenticated: boolean, now = Date.now()): boolean {
    const buckets = authenticated ? this.authenticated : this.anonymous;
    if (now >= this.nextSweep) {
      for (const map of [this.anonymous, this.authenticated])
        for (const [id, bucket] of map) if (bucket.until <= now) map.delete(id);
      this.nextSweep = now + 1000;
    }
    let bucket = buckets.get(key);
    if (bucket && bucket.until <= now) {
      buckets.delete(key);
      bucket = undefined;
    }
    if (!bucket) {
      // Bound memory without making capacity a global admission gate. Existing windows
      // are insertion-ordered; discard the oldest rather than denying every new caller.
      if (buckets.size >= 10000) buckets.delete(buckets.keys().next().value);
      bucket = { count: 0, until: now + 60000 };
      buckets.set(key, bucket);
    }
    return ++bucket.count <= limit;
  }
}

@Injectable()
export class McpOAuthThrottleGuard implements CanActivate {
  private readonly windows = new OAuthRateWindows();
  private readonly trust: (address: string) => boolean;
  constructor(
    private readonly oauth: McpOAuthService,
    config: ConfigService
  ) {
    // Trust only explicitly configured proxy networks, never a caller-controlled leftmost XFF.
    const proxies = (config.get<string>('MCP_OAUTH_TRUSTED_PROXIES') || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    this.trust = proxies.length ? proxyaddr.compile(proxies) : () => false;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.oauth.assertEnabled();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const route = context.getHandler().name;
    if (route === 'exchange' || route === 'preflight') return true;
    const address = oauthAddressBucket(proxyaddr(request, this.trust));
    const grant = await this.oauth.rateLimitGrant(route, request.body || {}, request.headers);
    const key = hash(`${route}:${grant ? 'grant:' + grant : 'ip:' + address}`);
    if (!this.windows.take(key, route === 'register' ? 10 : 120, !!grant)) {
      response.setHeader('Retry-After', '60');
      throw new OAuthFailure('temporarily_unavailable', 'Too many requests; retry shortly', 429);
    }
    return true;
  }
}
