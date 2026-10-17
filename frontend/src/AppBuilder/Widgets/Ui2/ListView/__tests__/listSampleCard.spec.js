import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { SAMPLE_CARD, sampleCardLayouts } from '@/AppBuilder/Widgets/Ui2/ListView/listSampleCard';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';

const listView = shadcnConfigs.find((config) => config.name === 'ShadListView');
const children = (mode) =>
  SAMPLE_CARD[mode].map(({ type, layout }, i) => ({ id: `c${i}`, type, layout: { ...layout } }));

describe('List view sample card', () => {
  it('matches the components a new List view drops with', () => {
    expect(listView.defaultChildren.map(({ componentName, layout }) => ({ type: componentName, layout }))).toEqual(
      SAMPLE_CARD.list
    );
  });

  it('moves an untouched row card into a stacked grid card, and back', () => {
    const toGrid = sampleCardLayouts(children('list'), 'grid');
    expect(Object.values(toGrid)).toEqual(SAMPLE_CARD.grid.map((c) => c.layout));
    const toList = sampleCardLayouts(children('grid'), 'list');
    expect(Object.values(toList)).toEqual(SAMPLE_CARD.list.map((c) => c.layout));
  });

  it('leaves a card the author changed as it is', () => {
    const moved = children('list');
    moved[3].layout.left = 30;
    expect(sampleCardLayouts(moved, 'grid')).toBeNull();
    expect(sampleCardLayouts([...children('list'), { id: 'x', type: 'ShadText', layout: {} }], 'grid')).toBeNull();
    expect(sampleCardLayouts(children('list').slice(1), 'grid')).toBeNull();
    // Already a grid card: switching to grid again changes nothing.
    expect(sampleCardLayouts(children('grid'), 'grid')).toBeNull();
  });
});
