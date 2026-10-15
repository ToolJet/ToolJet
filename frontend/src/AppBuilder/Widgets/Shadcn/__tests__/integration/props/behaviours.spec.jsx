import useStore from '@/AppBuilder/_stores/store'; // eslint-disable-line no-unused-vars -- marks this a real-store (integration) spec
import { installGuards, takeErrors, crashed } from './harness';
import { PROBES } from './coverage';
import { runProbe } from './probes';

// Every property the generic check (shard*.spec) could not see working at rest, with the state or interaction that
// shows it: a probe passes when the property, set away from its default, changes what the user sees or what the
// widget exposes. The probes, and what is proved elsewhere, are listed in coverage.jsx.
installGuards();

// ModalV2 portals into the page's canvas area, which the app builder page always provides.
beforeEach(() => {
  const host = document.createElement('div');
  host.className = 'canvas-content';
  host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
  document.body.appendChild(host);
});
afterEach(() => document.querySelectorAll('.canvas-content').forEach((n) => n.remove()));

describe.each(PROBES.map((p) => [`${p.widget} ${p.section === 'styles' ? 'style ' : ''}${p.key}`, p]))(
  '%s',
  (_, probe) => {
    it('changes what the user sees or what the widget exposes', async () => {
      const result = await runProbe(probe);
      expect(crashed()).toBe(false);
      expect(takeErrors()).toEqual([]);
      expect(result.changed).toBe(true);
    }, 120000);
  }
);
