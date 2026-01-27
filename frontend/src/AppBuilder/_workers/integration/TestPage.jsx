/**
 * Worker Test Page
 *
 * A standalone page component for testing the worker architecture.
 *
 * To use this:
 * 1. Add a route in your router:
 *    <Route path="/worker-test" element={<WorkerTestPage />} />
 *
 * 2. Or render directly in any component:
 *    import { WorkerTestPage } from '@/AppBuilder/_workers/integration/TestPage';
 *    <WorkerTestPage />
 *
 * 3. Or just import in browser console:
 *    (Open dev tools, then in console)
 *    const { WorkerIntegrationTest } = await import('@/AppBuilder/_workers');
 */

import React from "react";
import { WorkerIntegrationTest } from "./WorkerIntegrationTest";

export function WorkerTestPage() {
  return <WorkerIntegrationTest />;
}

export default WorkerTestPage;
