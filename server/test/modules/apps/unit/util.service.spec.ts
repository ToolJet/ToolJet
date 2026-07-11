import { AppsUtilService } from '@modules/apps/util.service';

const INPUT_LABEL_HEIGHT_MODE_PROPERTY = '__inputLabelHeightMode';

const buildComponent = (properties = {}) => ({
  textInput1: {
    component: {
      component: 'TextInput',
      name: 'textInput1',
      definition: {
        properties,
        styles: {},
        generalStyles: {},
        validation: {},
        others: {},
        general: {},
      },
    },
    layouts: {},
  },
});

describe('AppsUtilService.buildComponentMetaDefinition', () => {
  const buildComponentMetaDefinition = AppsUtilService.prototype.buildComponentMetaDefinition;

  it('does not add the new sizing marker to legacy components', () => {
    const components = buildComponent({ label: { value: '' } });

    buildComponentMetaDefinition.call({}, components);

    expect(components.textInput1.component.definition.properties[INPUT_LABEL_HEIGHT_MODE_PROPERTY]).toBeUndefined();
  });

  it('preserves the sizing marker for new components', () => {
    const components = buildComponent({
      label: { value: '' },
      [INPUT_LABEL_HEIGHT_MODE_PROPERTY]: { value: 'fixed' },
    });

    buildComponentMetaDefinition.call({}, components);

    expect(components.textInput1.component.definition.properties[INPUT_LABEL_HEIGHT_MODE_PROPERTY]).toEqual({
      value: 'fixed',
    });
  });
});
