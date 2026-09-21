import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export function defineNetworkScenario(routes) {
  return routes.map(({ method = 'get', url, status = 200, json }) => {
    const factory = http[method.toLowerCase()];
    if (!factory || !url) throw new Error(`Invalid network route: ${method} ${url || ''}`.trim());
    return factory(url, () => HttpResponse.json(json, { status }));
  });
}

export function createAppBuilderNetwork(routes = []) {
  const server = setupServer(...defineNetworkScenario(routes));
  server.listen({ onUnhandledRequest: 'error' });
  return { close: () => server.close() };
}
