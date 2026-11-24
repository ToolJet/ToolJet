import { getDynamicLayoutKey, resolveWidgetMeasuredHeight } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

// A hidden widget that does not collapse keeps its authored slot, not the height it grew to while shown.
test('[TextArea-DH-003] a hidden dynamic-height widget falls back to its authored height, not its grown height', () => {
  // Break this catches: keeping the larger of the grown temp height and the authored height for a hidden widget, so
  // after hiding a grown Text Area the widgets below stay where it pushed them.
  document.body.innerHTML = '';
  const height = resolveWidgetMeasuredHeight({
    componentId: 'textarea4',
    currentLayout: 'desktop',
    currentPageComponents: { textarea4: { layouts: { desktop: { top: 80, height: 100 } } } },
    temporaryLayouts: { [getDynamicLayoutKey('textarea4', null, '', 'canvas')]: { height: 322 } },
    contextIndices: null,
    isContainer: false,
    visibility: false,
  });

  expect(height).toBe(100);
});
