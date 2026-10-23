// Leak suite, UI 2.0 display: see leakSuite.jsx.
import { leakSuite } from './leakSuite';

jest.mock('zustand', () => require('./countingZustand'));

leakSuite('display');
