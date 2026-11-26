import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-177): a Rocket 2.0 Rating with Default value 2.5 showed 3 while Allow half values was off, and kept 3 when it
// was turned on while the app ran (bound to an input); turned on in the inspector it shows 2.5, and the native Rating
// shows 2.5 too. The pack component, the inline SDK and the host renderer are the real ones; only module and CSS
// loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Rocket Rating: Allow half values turned on live', () => {
  test('[PackComponent-RATING-HALF-001] an untouched Default value 2.5 becomes 2.5 when half values turn on', async () => {
    const v = await mountPack('shadcn', 'Rating', { defaultValue: 2.5, allowHalf: false });
    expect(v.exposed.value).toBe(3);
    await v.update({ props: { defaultValue: 2.5, allowHalf: true } });
    expect(v.exposed.value).toBe(2.5);
  });

  test('[PackComponent-RATING-HALF-002] control: a rating that was set stays when half values turn on', async () => {
    const v = await mountPack('shadcn', 'Rating', { defaultValue: 2.5, allowHalf: false });
    await v.run('setValue', 4);
    await v.update({ props: { defaultValue: 2.5, allowHalf: true } });
    expect(v.exposed.value).toBe(4);
  });
});
