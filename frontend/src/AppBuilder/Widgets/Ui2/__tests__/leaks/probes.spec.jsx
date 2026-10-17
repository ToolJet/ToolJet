// The leak suite's own check: a widget that leaks one of everything the suite looks for must fail on each of them, so a
// green leak suite means the widgets are clean, not that a probe went blind. The Spinner's module is swapped for the
// leaking widget; the rest of the path (harness, store, RenderWidget, the lazy registry) is the real one.
import { measureWidget } from './leakSuite';

jest.mock('zustand', () => require('./countingZustand'));

jest.mock('@/AppBuilder/Widgets/Ui2/Spinner/Spinner', () => {
  const R = jest.requireActual('react');
  const L = jest.requireActual('leaflet');
  const useStore = jest.requireActual('@/AppBuilder/_stores/store').default;
  const Leaky = () => {
    const ref = R.useRef(null);
    R.useEffect(() => {
      const { document } = globalThis;
      globalThis.addEventListener('resize', () => {});
      document.addEventListener('keydown', () => {}, true);
      new globalThis.ResizeObserver(() => {}).observe(document.body);
      new globalThis.IntersectionObserver(() => {}).observe(document.body);
      setInterval(() => {}, 1000);
      setTimeout(() => {}, 5000);
      useStore.subscribe(() => {});
      document.body.appendChild(document.createElement('div'));
      document.body.setAttribute('data-scroll-locked', 'yes');
      const map = L.map(ref.current, { center: [0, 0], zoom: 2 });
      L.tileLayer('https://tiles.invalid/{z}/{x}/{y}.png').addTo(map);
    }, []);
    return R.createElement('div', { ref, style: { width: 200, height: 200 } });
  };
  return { __esModule: true, default: Leaky };
});

describe('UI 2.0 leak suite probes', () => {
  it('catch a widget that leaks one of everything', async () => {
    const { problems } = await measureWidget('ShadSpinner');
    const text = problems.join('\n');

    expect(text).toMatch(/window\/document listeners added and never removed: \d+/);
    expect(text).toMatch(/window 'resize'/);
    expect(text).toMatch(/document 'keydown' \(capture\)/);
    expect(text).toMatch(/ResizeObserver observing/);
    expect(text).toMatch(/IntersectionObserver observing/);
    expect(text).toMatch(/timers still scheduled after unmount/);
    expect(text).toMatch(/setInterval\(1000 ms\)/);
    expect(text).toMatch(/setTimeout\(5000 ms\)/);
    expect(text).toMatch(/zustand subscriptions/);
    expect(text).toMatch(/document\.body children/);
    expect(text).toMatch(/body attributes/);
    expect(text).toMatch(/Leaflet maps: \d+ made, 0 removed/);
    expect(text).toMatch(/Leaflet tile layers on a map/);
  }, 60000);
});
