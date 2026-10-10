import useStore from '@/AppBuilder/_stores/store';
import { CONFIGS, NAMES, crashed, installGuards, mountWidget, takeErrors } from './harness';

// Dynamic height: in view mode a widget with it on sizes its box to its content, through ToolJet's reflow (the box
// height follows the measured content); with it off the box keeps its drawn height. jsdom has no layout, so the
// content is given a measured height and the check is that the widget asks for a reflow, or does not.
installGuards();

const WITH_DYNAMIC_HEIGHT = NAMES.filter((n) => CONFIGS[n].properties?.dynamicHeight);
// An image fits its height to its width only with an aspect ratio; without one it fills the box drawn for it.
const CONTEXT = { ShadImage: { aspectRatio: '16/9' } };

describe.each(WITH_DYNAMIC_HEIGHT)('%s', (name) => {
  it('asks for a reflow to fit its content with Dynamic height on, and not with it off', async () => {
    const reflowsWith = async (on) => {
      const calls = [];
      const original = useStore.getState().scheduleReflow;
      useStore.setState({ scheduleReflow: (...args) => calls.push(args[0]) });
      const m = await mountWidget(name, {
        properties: { ...CONTEXT[name], dynamicHeight: `{{${on}}}` },
        offsetHeight: 333,
      });
      expect(crashed()).toBe(false);
      await m.unmount();
      useStore.setState({ scheduleReflow: original });
      return calls.filter((id) => id === m.id).length;
    };
    expect(await reflowsWith(false)).toBe(0);
    expect(await reflowsWith(true)).toBeGreaterThan(0);
    expect(takeErrors()).toEqual([]);
  });
});
