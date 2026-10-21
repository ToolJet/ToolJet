import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// The editor marks a widget whose box follows its content in the viewer (purple outline, handle and resize lines).
// fitsContentInView says yes for every UI 2.0 widget whose Dynamic height is not off, so a Skeleton, a Button or a chart
// (no Dynamic height property, never measured) was drawn purple though its box keeps its height. marksDynamicHeight
// marks only the widgets that measure themselves or have the property; this keeps its list in step with the widgets.
import fs from 'fs';
import path from 'path';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { fitsContentInView, marksDynamicHeight } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const UI2 = path.resolve(__dirname, '../..');
const registry = fs.readFileSync(path.join(UI2, 'registry.ts'), 'utf8');
const MEASURES = /\b(useAutoHeight|useDynamicHeight|useFittedRowHeight)\(/;
const measures = (type) => {
  const module = registry.match(new RegExp(`${type}: lazy\\(\\(\\) => import\\('\\./([^']+)'\\)`))?.[1];
  return !!module && MEASURES.test(fs.readFileSync(path.join(UI2, `${module}.tsx`), 'utf8'));
};

describe('the editor dynamic-height marker on UI 2.0 widgets', () => {
  test.each(shadcnConfigs.map((c) => [c.name, c]))(
    '%s is marked only if its box follows its content',
    (type, config) => {
      const hasProperty = !!config.properties?.dynamicHeight;
      expect(marksDynamicHeight(type, {})).toBe(hasProperty || measures(type));
    }
  );

  test('the Skeleton is not marked; the Stat is, unless its Dynamic height is off', () => {
    expect(marksDynamicHeight('ShadSkeleton', {})).toBe(false);
    expect(marksDynamicHeight('ShadStat', {})).toBe(true);
    expect(marksDynamicHeight('ShadStat', { dynamicHeight: false })).toBe(false);
  });

  test('the layout rule itself is unchanged; native widgets follow their property', () => {
    expect(fitsContentInView('ShadSkeleton', {})).toBe(true);
    expect(marksDynamicHeight('TextInput', { dynamicHeight: true })).toBe(true);
    expect(marksDynamicHeight('TextInput', {})).toBe(false);
  });

  test("the resize lines read the same rule (the grid's checkHoveredComponentDynamicHeight)", () => {
    seedApp({
      sk1: componentDefinition('sk1', 'skeleton1', 'ShadSkeleton'),
      st1: componentDefinition('st1', 'stat1', 'ShadStat'),
      st2: componentDefinition('st2', 'stat2', 'ShadStat', { dynamicHeight: binding('{{false}}') }),
      ti1: componentDefinition('ti1', 'input1', 'TextInput', { dynamicHeight: binding('{{true}}') }),
    });
    const check = useStore.getState().checkHoveredComponentDynamicHeight;
    expect([check('sk1'), check('st1'), check('st2'), !!check('ti1')]).toEqual([false, true, false, true]);
  });
});
