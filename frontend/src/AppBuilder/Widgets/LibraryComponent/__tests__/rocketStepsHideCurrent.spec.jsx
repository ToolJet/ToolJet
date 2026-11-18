import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (DVRL-51): hiding a Rocket 2.0 Steps' current step with Set step visible moved it onto a disabled step, which no
// action or click may land on. The pack component, the inline SDK and the host renderer are the real ones; only module
// and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const step = (id, disabled = false) => ({ id, name: id.toUpperCase(), disabled });
const hideCurrent = async (steps, current, hide) => {
  const v = await mountPack('shadcn', 'Steps', { steps, currentStepIndex: current });
  await v.run('setStepVisible', hide, false);
  return { id: v.exposed.currentStepId, index: v.exposed.currentStepIndex };
};

describe('Rocket Steps: hiding the current step never lands on a disabled one', () => {
  test('[PackComponent-STEPS-HIDE-001] the last step hidden, next to a disabled one, goes to the step before that', async () => {
    expect(await hideCurrent([step('p'), step('q', true), step('r')], 2, 'r')).toEqual({ id: 'p', index: 0 });
  });

  test('[PackComponent-STEPS-HIDE-002] control: a step after it is taken when there is one', async () => {
    expect(await hideCurrent([step('p'), step('q', true), step('r'), step('s')], 2, 'r')).toEqual({
      id: 's',
      index: 2,
    });
  });
});
