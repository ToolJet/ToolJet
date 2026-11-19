import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-132): a Rocket 2.0 Steps whose Current step (id) was set in the inspector opened on the 0-based index's step
// instead; it moved only when the id changed later. The native Steps opens on its current step id. The pack component,
// the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const STEPS = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, name: ['Alpha', 'Beta', 'Gamma', 'Delta'][i] }));
const opened = async (props) => {
  const v = await mountPack('shadcn', 'Steps', { steps: STEPS, ...props });
  return { id: v.exposed.currentStepId, index: v.exposed.currentStepIndex };
};

describe('Rocket Steps: Current step (id) is the step it opens on', () => {
  test('[PackComponent-STEPS-ID-001] Current step (id) c opens on Gamma', async () => {
    expect(await opened({ currentStep: 'c' })).toEqual({ id: 'c', index: 2 });
  });

  test('[PackComponent-STEPS-ID-002] the saved 0-based index (1) does not win over the id', async () => {
    expect(await opened({ currentStep: 'c', currentStepIndex: 1 })).toEqual({ id: 'c', index: 2 });
  });

  test('[PackComponent-STEPS-ID-003] control: with no id, the 0-based index 2 opens on Gamma', async () => {
    expect(await opened({ currentStepIndex: 2 })).toEqual({ id: 'c', index: 2 });
  });
});
