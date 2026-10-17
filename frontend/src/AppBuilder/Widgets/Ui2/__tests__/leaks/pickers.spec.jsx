// Leak suite, UI 2.0 pickers: see leakSuite.jsx.
import { leakSuite } from './leakSuite';

jest.mock('zustand', () => require('./countingZustand'));

leakSuite('pickers');
