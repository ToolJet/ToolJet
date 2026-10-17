// Leak suite, UI 2.0 charts: see leakSuite.jsx.
import { leakSuite } from './leakSuite';

jest.mock('zustand', () => require('./countingZustand'));

leakSuite('charts');
