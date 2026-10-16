import { getWidgetVersionLabel } from '@/AppBuilder/RightSideBar/WidgetBox/widgetVersionLabel';

describe('AB-COMPONENT-PICKER-001 component version labels', () => {
  it('removes new and legacy tile labels while preserving the beta label', () => {
    expect(getWidgetVersionLabel('ModalV2')).toBeNull();
    expect(getWidgetVersionLabel('Modal')).toBeNull();
    expect(getWidgetVersionLabel('FlexContainer')).toBe('Beta');
  });
});
