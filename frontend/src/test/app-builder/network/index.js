import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export function defineNetworkScenario(routes) {
  return routes.map(({ method = 'get', url, status = 200, json, body }) => {
    const factory = http[method.toLowerCase()];
    if (!factory || !url) throw new Error(`Invalid network route: ${method} ${url || ''}`.trim());
    // `body` sends raw text, e.g. a malformed JSON payload that `json` cannot express.
    if (body !== undefined) {
      return factory(url, () => new HttpResponse(body, { status, headers: { 'Content-Type': 'application/json' } }));
    }
    // `json` may be a function so a route can answer differently across a
    // single test — e.g. a licence endpoint the test flips between calls,
    // which is the only public way to move `license.featureAccess`. It receives
    // MSW's resolver info, so a route can answer from what the request sent.
    return factory(url, async (info) =>
      HttpResponse.json(typeof json === 'function' ? await json(info) : json, { status })
    );
  });
}

export function createAppBuilderNetwork(routes = []) {
  const server = setupServer(...defineNetworkScenario(routes));
  server.listen({ onUnhandledRequest: 'error' });
  return { close: () => server.close() };
}
