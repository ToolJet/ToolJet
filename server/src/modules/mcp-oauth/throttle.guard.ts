import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpOAuthService } from './service';
import { hash, OAuthFailure } from './protocol';
const proxyaddr = require('proxy-addr');

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
    if (bucket && bucket.until <= now) { buckets.delete(key); bucket = undefined; }
    if (!bucket) {
      if (buckets.size >= 10000) return false;
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
  constructor(private readonly oauth: McpOAuthService, config: ConfigService) {
    // Trust only explicitly configured proxy networks, never a caller-controlled leftmost XFF.
    const proxies = (config.get<string>('MCP_OAUTH_TRUSTED_PROXIES') || '').split(',').map(x => x.trim()).filter(Boolean);
    this.trust = proxies.length ? proxyaddr.compile(proxies) : () => false;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.oauth.assertEnabled();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const route = context.getHandler().name;
    if (route === 'exchange' || route === 'preflight') return true;
    const address = proxyaddr(request, this.trust);
    const grant = await this.oauth.rateLimitGrant(route, request.body || {}, request.headers);
    const key = hash(`${route}:${grant ? 'grant:' + grant : 'ip:' + address}`);
    if (!this.windows.take(key, route === 'register' ? 10 : 120, !!grant)) {
      response.setHeader('Retry-After', '60');
      throw new OAuthFailure('temporarily_unavailable', 'Too many requests; retry shortly', 429);
    }
    return true;
  }
}
