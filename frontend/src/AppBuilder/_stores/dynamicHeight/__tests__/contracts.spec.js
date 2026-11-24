import { componentTypes } from '@/AppBuilder/WidgetManager/componentTypes';
import { CONTENT_KINDS, heightContractOf } from '../contracts';

describe('height contracts on widget definitions', () => {
  it('every declared contract names how its content is laid out', () => {
    const declared = componentTypes.filter((widget) => widget.heightContract);
    expect(declared.length).toBeGreaterThan(0);
    for (const widget of declared) {
      expect(CONTENT_KINDS).toContain(widget.heightContract.content);
    }
  });

  it('every container the engine solves declares one', () => {
    for (const type of ['Container', 'Form', 'Tabs', 'Accordion', 'ModalV2', 'ModuleContainer']) {
      expect(heightContractOf(type)?.content).toBe('grid');
    }
    expect(heightContractOf('Listview')?.content).toBe('rows');
    expect(heightContractOf('FlexContainer')?.content).toBe('flex');
  });

  it('a leaf has no contract, so it is measured and never solved', () => {
    for (const type of ['Text', 'Button', 'Table', 'TextArea']) {
      expect(heightContractOf(type)).toBeNull();
    }
  });
});
