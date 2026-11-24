import { AsyncLocalStorage } from 'async_hooks';

// Set to true to opt a call chain out of AppsSubscriber.afterLoad hydration. List endpoints
// use it to run one bulk query instead; single-app reads that never touch editingVersion/isStub
// use it because afterLoad opens its own pooled connections per loaded App.
// Lives outside apps.subscriber.ts so AppsRepository can import it without an import cycle
// (the subscriber injects AppsRepository).
export const skipAppEditingVersionHydration = new AsyncLocalStorage<boolean>();
