import { usesFlexLayoutV2, dropNewContainerDefaults } from '../flexLayoutVersion';
import { flexContainerConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';
import fs from 'fs';
import path from 'path';

// FlexContainers saved on lts-3.16 have no layoutVersion and keep that release's layout; containers created since carry
// layoutVersion '2' from the widget's default definition and get the UI 2.0 layout.
describe('FlexContainer layout version', () => {
  it('reads the flag from resolved properties and from a definition', () => {
    expect(usesFlexLayoutV2({ layoutVersion: '2' })).toBe(true);
    expect(usesFlexLayoutV2({ layoutVersion: 2 })).toBe(true);
    expect(usesFlexLayoutV2({ layoutVersion: { value: '2' } })).toBe(true);
    expect(usesFlexLayoutV2({})).toBe(false);
    expect(usesFlexLayoutV2(undefined)).toBe(false);
    expect(usesFlexLayoutV2({ layoutVersion: { value: '' } })).toBe(false);
  });

  it('is written by the default definition, so a new drop (and the MCP, which takes those defaults) carries it', () => {
    expect(usesFlexLayoutV2(flexContainerConfig.definition.properties)).toBe(true);
    // Equal heights is on for a new container; a saved one has no value and reads off.
    expect(flexContainerConfig.definition.properties.equalHeights).toEqual({ value: '{{true}}' });
  });

  it('is not added to a saved container when the widget defaults are merged into it (a cloned page)', () => {
    const merged = { direction: { value: 'row' }, layoutVersion: { value: '2' }, equalHeights: { value: '{{true}}' } };
    expect(dropNewContainerDefaults('FlexContainer', merged, { direction: { value: 'row' } })).toEqual({
      direction: { value: 'row' },
    });
    // A container that already has them keeps its own values.
    const saved = { layoutVersion: { value: '2' }, equalHeights: { value: '{{false}}' } };
    expect(
      dropNewContainerDefaults('FlexContainer', { ...merged, equalHeights: { value: '{{false}}' } }, saved)
    ).toEqual({ direction: { value: 'row' }, layoutVersion: { value: '2' }, equalHeights: { value: '{{false}}' } });
    // Other widgets are left alone.
    expect(dropNewContainerDefaults('Container', { layoutVersion: { value: '2' } }, {})).toEqual({
      layoutVersion: { value: '2' },
    });
  });

  it('stays absent on a saved container after buildComponentMetaDefinition (page clone) merges the defaults', () => {
    const saved = {
      flex1: {
        component: {
          component: 'FlexContainer',
          name: 'flex1',
          definition: { properties: { direction: { value: 'row' } } },
        },
        layouts: {},
      },
    };
    const { properties } = buildComponentMetaDefinition(saved).flex1.component.definition;
    expect(properties.direction).toEqual({ value: 'row' });
    expect(properties.layoutVersion).toBeUndefined();
    expect(properties.equalHeights).toBeUndefined();
    // Other defaults still fill in, as before.
    expect(properties.gap).toEqual({ value: '12' });
  });

  it("is taken back out by the server's merge of the widget defaults into saved components (shared helper)", () => {
    const server = fs.readFileSync(
      path.resolve(__dirname, '../../../../../server/src/modules/apps/util.service.ts'),
      'utf8'
    );
    expect(server).toMatch(/import \{ dropNewContainerDefaults \} from '@tooljet\/widget-definitions'/);
    expect(server).toMatch(/properties: dropNewContainerDefaults\(/);
  });
});
