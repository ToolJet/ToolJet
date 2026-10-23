// A widget's default children are created on drop only for the types listed in WIDGETS_WITH_DEFAULT_CHILDREN. The
// ToolJet UI 2.0 List view gained default children but was not listed, so a new one still dropped empty and read as
// broken. Every pack widget that declares default children must be on the list.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { shadcnConfigs } from '../../../WidgetManager/widgets/shadcn';
import { WIDGETS_WITH_DEFAULT_CHILDREN } from '../../../AppCanvas/appCanvasConstants';

const withChildren = shadcnConfigs.filter((config) => config.defaultChildren?.length).map((config) => config.name);

describe('pack widgets with default children create them on drop', () => {
  it('finds pack widgets with default children', () => {
    expect(withChildren).toEqual(expect.arrayContaining(['ShadListView', 'ShadDialog']));
  });
  it.each(withChildren)('%s', (name) => {
    expect(WIDGETS_WITH_DEFAULT_CHILDREN).toContain(name);
  });
});
