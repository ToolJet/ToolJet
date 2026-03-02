# Custom Domains — Cloudflare Dashboard Setup Guide

Step-by-step dashboard configuration for serving the ToolJet frontend via Cloudflare Workers + Pages with custom hostname support (Cloudflare for SaaS).

## Architecture

```
Customer types: mystore.acme.com
  → DNS CNAME → proxy-fallback.tooljet.ai
  → Cloudflare Custom Hostnames (SSL for SaaS) on tooljet.ai zone
  → Worker route */* matches the request
  → Worker fetches SPA from Cloudflare Pages (tooljet-cloud-stage.pages.dev)
  → SPA boots, calls /custom-domains/resolve API → gets workspace
```

## Prerequisites

- A Cloudflare account with the SaaS zone added (e.g., `tooljet.ai`)
- The **Cloudflare for SaaS** subscription enabled on the zone

---

## Step 1: Create the Pages Project

This hosts the frontend static build.

1. Go to **Workers & Pages** in the sidebar
2. Click **Create**
3. Select the **Pages** tab
4. Choose **Upload assets**
5. Set project name (e.g., `tooljet-cloud-stage`)
6. Upload the contents of `frontend/build/`
7. Click **Deploy site**

Once deployed, verify the project is live by visiting the `.pages.dev` URL shown on the deployment page (e.g., `https://tooljet-cloud-stage.pages.dev`). You should see the ToolJet app load.

> [Cloudflare Pages — Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)

---

## Step 2: Create the Worker

This Worker proxies requests to the Pages project and handles SPA routing.

1. Go to **Workers & Pages** in the sidebar
2. Click **Create**
3. Select the **Worker** tab
4. Name it (e.g., `cloud-stage-worker`)
5. Click **Deploy** to create it with the default code
6. Once created, click **Edit code**
7. Replace all the code with:

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, search } = url;
    const PAGES = env.PAGES_ORIGIN || 'https://tooljet-cloud-stage.pages.dev';
    const API_SERVER = env.API_SERVER || 'https://gcpstage-server.tooljet.ai';

    // Proxy API + WebSocket requests to the backend
    if (pathname.startsWith('/api/') || pathname === '/api' || pathname === '/ws' || pathname === '/yjs') {
      const target = new URL(pathname + search, API_SERVER);
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set('X-Forwarded-Host', url.hostname);
      proxyHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
      proxyHeaders.set('X-Real-IP', request.headers.get('CF-Connecting-IP') || '');

      const isWebSocket = request.headers.get('Upgrade') === 'websocket';

      try {
        return await fetch(new Request(target.toString(), {
          method: request.method,
          headers: proxyHeaders,
          body: isWebSocket ? undefined : request.body,
          redirect: 'manual',       // SSO redirects must reach the browser
        }));
      } catch {
        return new Response('Backend unavailable', { status: 502 });
      }
    }

    // Serve static assets from Pages
    if (/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|eot|gif|map|gz|json|webp|csv|mjs|jsx)$/i.test(pathname)) {
      return fetch(PAGES + pathname);
    }

    // SPA fallback
    return fetch(PAGES + '/index.html');
  },
};
```

8. Click **Deploy**
9. Go to **Settings** → **Variables and Secrets** and add:
   - `API_SERVER` = your backend URL (e.g., `https://gcpstage-server.tooljet.ai`)
   - `PAGES_ORIGIN` = your Pages URL (e.g., `https://tooljet-cloud-stage.pages.dev`)

**What this does:**
- **API proxy**: Requests to `/api/*`, `/ws`, and `/yjs` are forwarded to the backend server. This makes API cookies first-party on custom domains (fixes incognito sign-in where third-party cookies are blocked).
- **Static assets**: Paths with file extensions (`.js`, `.css`, `.png`, etc.) are fetched from Pages.
- **SPA fallback**: Everything else returns `index.html` so React Router handles client-side routing.

**Important:** The code must be plain JavaScript. TypeScript syntax (type annotations like `request: Request`) will cause a runtime crash (Cloudflare error 1101).

To verify, use the **Preview** panel on the right side of the editor — you should see the ToolJet app load.

> [Cloudflare Workers](https://developers.cloudflare.com/workers/)

---

## Step 3: Create the Fallback Origin DNS Record

The fallback origin is the hostname Cloudflare routes Custom Hostname traffic to. Since the Worker handles everything (no real server), this is an originless record.

1. Go to **DNS** → **Records** in the sidebar
2. Click **Add record**
3. Fill in:

| Field | Value |
|---|---|
| Type | `AAAA` |
| Name | `proxy-fallback` |
| IPv6 address | `100::` |
| Proxy status | **Proxied** (orange cloud — this is required) |
| TTL | Auto |

4. Click **Save**

`100::` is a reserved IPv6 address for originless setups. Traffic never reaches this address because the Worker intercepts it first. Alternatively, you can use Type `A` with address `192.0.2.1` — both work the same way.

The name `proxy-fallback` is a choice — you can use any subdomain name. This becomes `proxy-fallback.tooljet.ai` which is used in later steps.

> [DNS Records — Originless setups](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/#originless-setups)

---

## Step 4: Set the Fallback Origin for Custom Hostnames

1. Go to **SSL/TLS** → **Custom Hostnames** in the sidebar
2. Under **Fallback Origin**, enter: `proxy-fallback.tooljet.ai`
3. Click **Add**
4. **Wait** for the Fallback Origin status to show **Active** (green)

This tells Cloudflare: "when traffic arrives for any registered Custom Hostname, route it to `proxy-fallback.tooljet.ai`."

The fallback origin **must** be a proxied DNS record in the same zone (the record you created in Step 3). If the status stays pending, double-check that the DNS record exists and is proxied (orange cloud).

> [Configuring Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/getting-started/)

---

## Step 5: Configure Worker Routes

This is the most critical step and where most issues occur.

**Why this is needed:** When a customer visits `mystore.acme.com`, the request enters your zone with `Host: mystore.acme.com` — NOT `Host: proxy-fallback.tooljet.ai`. A route must match the actual Host header for the Worker to run. Since customer hostnames are dynamic (added at runtime), you need a `*/*` wildcard route to catch all of them.

**The problem with `*/*`:** It matches ALL traffic on the zone, including your existing services. To protect them, you add more specific routes with Worker set to **None**. Cloudflare always picks the most specific matching route — order does not matter.

### How to add routes

1. Go to the **tooljet.ai** zone in the dashboard
2. In the sidebar, find **Workers Routes** (under the Workers section)
3. Click **Add route** for each of the following:

### Routes to add

Add these four routes (in any order):

**Route 1 — Fallback origin**
| Field | Value |
|---|---|
| Route | `proxy-fallback.tooljet.ai/*` |
| Worker | `cloud-stage-worker` |

**Route 2 — Protect all subdomains**
| Field | Value |
|---|---|
| Route | `*.tooljet.ai/*` |
| Worker | **None** |

**Route 3 — Protect apex domain**
| Field | Value |
|---|---|
| Route | `tooljet.ai/*` |
| Worker | **None** |

**Route 4 — Catch-all for custom hostnames**
| Field | Value |
|---|---|
| Route | `*/*` |
| Worker | `cloud-stage-worker` |

### How Cloudflare evaluates these routes

Cloudflare picks the **most specific** match. Order in the list does not matter.

```
Request: mystore.acme.com/dashboard
  ✗ proxy-fallback.tooljet.ai/*     → host doesn't match
  ✗ *.tooljet.ai/*                  → host doesn't match
  ✗ tooljet.ai/*                    → host doesn't match
  ✓ */*                             → MATCH → Worker runs → serves SPA
```

```
Request: gcpstage.tooljet.ai/some-page
  ✗ proxy-fallback.tooljet.ai/*     → host doesn't match
  ✓ *.tooljet.ai/*                  → MATCH (most specific) → Worker NONE → normal origin
  ✓ */*                             → matches but less specific, ignored
```

```
Request: tooljet.ai/
  ✗ proxy-fallback.tooljet.ai/*     → host doesn't match
  ✗ *.tooljet.ai/*                  → apex doesn't match wildcard subdomain
  ✓ tooljet.ai/*                    → MATCH (most specific) → Worker NONE → redirect rule fires
  ✓ */*                             → matches but less specific, ignored
```

```
Request: proxy-fallback.tooljet.ai/index.html
  ✓ proxy-fallback.tooljet.ai/*     → MATCH (most specific) → Worker runs
  ✓ *.tooljet.ai/*                  → matches but less specific, ignored
  ✓ */*                             → matches but less specific, ignored
```

> [Workers routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
> [Workers as your fallback origin](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/worker-as-origin/)

---

## Step 6: Add a Custom Hostname (for testing)

In production, custom hostnames are added programmatically by the ToolJet server via the Cloudflare API. For manual testing:

1. Go to **SSL/TLS** → **Custom Hostnames**
2. Click **Add Custom Hostname**
3. Enter the test domain (e.g., `test.akshay.fyi`)
4. Leave SSL settings as default (HTTP validation, DV certificate)
5. Click **Add**
6. Wait for both columns to show **Active**:
   - **Hostname status**: Active
   - **Certificate status**: Active

This can take a few minutes. Certificate provisioning requires the customer's DNS to be pointing to your fallback origin (see Step 7).

> [Certificate management](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/)

---

## Step 7: Customer DNS Setup

The customer (or you, for testing) needs to create a CNAME record pointing to your fallback origin.

On the customer's DNS provider:

| Type | Name | Target |
|---|---|---|
| CNAME | `test` (or their chosen subdomain) | `proxy-fallback.tooljet.ai` |

### If the customer's domain is also on Cloudflare (common during testing)

The CNAME record **must** be set to **DNS only** (grey cloud icon), **NOT** Proxied (orange cloud).

**Why:** If the record is proxied, the customer's Cloudflare zone claims ownership of the request and handles it directly. The request never reaches your zone's Custom Hostname configuration — resulting in a **522 error**.

**How to toggle:** On the customer's zone → DNS → Records → find the CNAME record → click the orange cloud icon to toggle it to grey (DNS only).

This is only an issue when both zones are on the same Cloudflare account (common during development/testing). In production, customers typically use external DNS providers where this doesn't apply.

---

## Debugging

### Dashboard locations for debugging

| What to check | Dashboard path |
|---|---|
| Pages deployment status | **Workers & Pages** → your Pages project → **Deployments** |
| Worker code and preview | **Workers & Pages** → your Worker → **Edit code** → use Preview panel |
| Worker runtime errors | **Workers & Pages** → your Worker → **Observability** → **Logs** |
| DNS records | **DNS** → **Records** |
| Fallback Origin status | **SSL/TLS** → **Custom Hostnames** → top of page |
| Custom Hostname status | **SSL/TLS** → **Custom Hostnames** → hostname table |
| Worker Routes | **Workers Routes** (zone sidebar) |

### Error code reference

**522 — Connection timed out**

The Worker is not intercepting the request. Traffic falls through to the originless DNS record (`100::`) which has no real server → connection times out.

Check in dashboard:
1. **Workers Routes** — is the `*/*` route present and pointing to your Worker?
2. **SSL/TLS → Custom Hostnames** — is the Fallback Origin showing **Active**?
3. **SSL/TLS → Custom Hostnames** — is the specific Custom Hostname showing **Active** for both hostname and certificate?
4. If the test domain is on Cloudflare — is the CNAME record set to **DNS only** (grey cloud)?

**1101 — Worker threw an exception**

The Worker code crashed at runtime.

Check in dashboard:
1. **Workers & Pages** → your Worker → **Observability** → **Logs** — look at the error message
2. Most common cause: TypeScript syntax in a `.js` file. The fix is to use plain JavaScript without type annotations.

**403 — Forbidden**

The Custom Hostname is not recognized or not active.

Check in dashboard:
1. **SSL/TLS → Custom Hostnames** — is the hostname listed? Is the status **Active**?
2. If not listed, the hostname was never added. Add it via the dashboard or verify the API call in the server logs.

**SPA loads but shows error page or wrong workspace**

The Worker is working correctly but the app can't resolve the custom domain.

Check:
1. Server env var `ENABLE_CUSTOM_DOMAINS` is set to `true`
2. The domain is registered in ToolJet's custom domain settings (not just in Cloudflare)
3. Server CORS configuration allows the custom domain origin

### Debug with curl (command line)

Test each hop independently to isolate where the chain breaks:

```bash
# 1. Is Pages working?
curl -sI https://tooljet-cloud-stage.pages.dev/
# Expect: 200

# 2. Is the Worker working?
curl -sI https://cloud-stage-worker.<account>.workers.dev/
# Expect: 200

# 3. Is the fallback origin reachable (Worker intercepts via route)?
curl -sI https://proxy-fallback.tooljet.ai/
# Expect: 200

# 4. Does the custom hostname work?
curl -sI https://test.akshay.fyi/
# Expect: 200

# 5. Does customer DNS resolve correctly?
dig test.akshay.fyi CNAME +short
# Expect: proxy-fallback.tooljet.ai
```

If steps 1-3 return 200 but step 4 returns 522, the issue is in the route configuration or the Custom Hostname setup (see the 522 section above).

> [Worker real-time logs](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/)

---

## Server Environment Variables

These are set on the ToolJet server, not in Cloudflare.

| Variable | Description | Example |
|---|---|---|
| `ENABLE_CUSTOM_DOMAINS` | Enable custom domain support | `true` |
| `CLOUDFLARE_API_TOKEN` | API token with Custom Hostnames edit permission | |
| `CLOUDFLARE_ZONE_ID` | Zone ID (found on zone Overview page in dashboard) | `f8d16fb3...` |
| `CLOUDFLARE_FALLBACK_ORIGIN` | Fallback origin hostname | `proxy-fallback.tooljet.ai` |
| `TOOLJET_HOST` | Main ToolJet host URL | `https://gcpstage.tooljet.ai` |

The Zone ID is found in the dashboard: go to your zone → **Overview** → right sidebar → **Zone ID**.

---

## Reference

- [Configuring Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/getting-started/)
- [Workers as your fallback origin](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/worker-as-origin/)
- [Custom origin server](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/custom-origin/)
- [Workers routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Certificate management](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/)
- [DNS records — Originless setups](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/#originless-setups)
- [Worker real-time logs](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/)
