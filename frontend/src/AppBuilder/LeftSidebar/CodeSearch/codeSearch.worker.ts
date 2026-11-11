// Indexes the app definition and runs searches off the main thread; see searchWorker.ts.
import { createSearcher } from './searchRecords';

const search = createSearcher();

onmessage = ({ data: { id, ...request } }) => postMessage({ id, result: search(request) });
