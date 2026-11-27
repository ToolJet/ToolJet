/**
 * The App Builder store owns the app's dynamic height scheduler (scheduler.js): one per store, wired to it, so a
 * widget's hook and the store's own actions feed the same frame.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { widget } from './dynamicHeightPage';

const s = () => useStore.getState();
const DH = { dynamicHeight: binding('{{true}}') };

describe('dynamic height: the store’s scheduler', () => {
  it('[DynamicHeight-STORE-001] is one scheduler for the whole store', () => {
    const scheduler = s().getDynamicHeightScheduler();
    expect(scheduler).toBe(s().getDynamicHeightScheduler());
    expect(typeof scheduler.observe).toBe('function');
  });

  it('[DynamicHeight-STORE-002] writes its passes to the store', () => {
    seedApp({
      a: widget('a', 'Text', { top: 0, properties: DH }),
      b: widget('b', 'Text', { top: 60 }),
    });
    const scheduler = s().getDynamicHeightScheduler();
    scheduler.scheduleDynamicHeight({ id: 'a', height: 100 });
    scheduler.flush();
    expect(s().temporaryLayouts).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 } });
  });
});
