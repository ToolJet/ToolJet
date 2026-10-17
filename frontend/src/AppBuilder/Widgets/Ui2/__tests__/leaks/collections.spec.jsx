// Leak suite, UI 2.0 collections: see leakSuite.jsx.
import { leakSuite } from './leakSuite';

jest.mock('zustand', () => require('./countingZustand'));

leakSuite('collections');
