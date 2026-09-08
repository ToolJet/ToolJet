import { getDroppableSlotIdOnScreen } from '../dragEnd';

// A Module widget renders its own nested droppable canvas, so its drag
// resolution (unlike every other widget type) must search for an inner
// `drag-container-parent` element and can come up empty even while the
// cursor is still within the source Modal's own dialog box.
describe('getDroppableSlotIdOnScreen - ModuleViewer inside a Modal', () => {
  const modalId = 'modal-1';
  const moduleId = 'module-1';

  const widgets = [
    { id: modalId, parent: null, component: { component: 'ModalV2', parent: null } },
    { id: moduleId, parent: modalId, component: { component: 'ModuleViewer', parent: modalId } },
  ];

  let moduleEl;
  let modalDialogEl;
  let elementsFromPointSpy;

  beforeEach(() => {
    moduleEl = document.createElement('div');
    moduleEl.id = moduleId;
    document.body.appendChild(moduleEl);

    modalDialogEl = document.createElement('div');
    modalDialogEl.className = `tj-modal-content-${modalId}`;
    modalDialogEl.getBoundingClientRect = () => ({
      left: 0,
      right: 500,
      top: 0,
      bottom: 500,
      width: 500,
      height: 500,
    });
    document.body.appendChild(modalDialogEl);

    // jsdom does not implement elementsFromPoint; stub it per test.
    elementsFromPointSpy = jest.fn(() => []);
    document.elementsFromPoint = elementsFromPointSpy;
  });

  afterEach(() => {
    moduleEl.remove();
    modalDialogEl.remove();
    delete document.elementsFromPoint;
  });

  // Break this catches: reverting the fallback (restoring `return slotId;`
  // as the branch's only return) makes this assert undefined instead of
  // modalId, reproducing the "Module drag snaps back" bug.
  it('keeps the Module in its source Modal when no drop target is found but the cursor is inside the Modal dialog', () => {
    const event = { target: moduleEl, clientX: 250, clientY: 250 };

    const result = getDroppableSlotIdOnScreen(event, widgets);

    expect(result).toBe(modalId);
  });

  it('does not fall back when the cursor is genuinely outside the source Modal dialog', () => {
    const event = { target: moduleEl, clientX: 900, clientY: 900 };

    const result = getDroppableSlotIdOnScreen(event, widgets);

    expect(result).toBeUndefined();
  });
});
