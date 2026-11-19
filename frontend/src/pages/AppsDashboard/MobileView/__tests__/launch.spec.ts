import { getAppTapResult } from '../helpers/launch';
import { makeApp } from './fixtures';

describe('getAppTapResult', () => {
  test('opens a launchable app in the viewer', () => {
    expect(getAppTapResult(makeApp('1', { slug: 'sales' }))).toEqual({ type: 'open', path: '/applications/sales' });
  });

  test('explains why an app that cannot launch is blocked', () => {
    const app = makeApp('1', {
      actions: { launch: { enabled: false, reason: 'maintenance' }, edit: true, delete: true, pin: true },
    });

    expect(getAppTapResult(app)).toEqual({ type: 'blocked', message: 'This app is under maintenance' });
  });

  test('does nothing for an app without a launch action', () => {
    const app = makeApp('1', { actions: { launch: null, edit: true, delete: true, pin: true } });

    expect(getAppTapResult(app)).toEqual({ type: 'none' });
  });
});
