// Opt-in MSW lifecycle for suites that exercise the HTTP layer (src/_services/**).
// Import at the top of the test file:  import '@/test/setupMsw';
// Requires the jest-fixed-jsdom environment (the global default) — plain jsdom
// lacks the fetch/TextEncoder globals MSW v2 needs.
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
