/**
 * Represents a potential drop target for widgets.
 */
export class DropAreaEntity {
  static dropAreaWidgets = ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'ModalV2', 'Listview', 'Container', 'Table'];

  constructor(widget, slotId) {
    this.widget = widget;
    this.id = widget?.id || 'canvas';
    this.slotId = slotId || 'real-canvas';
  }

  get isModal() {
    return ['Modal', 'ModalV2'].includes(this.widget?.component?.component);
  }

  get isNewModal() {
    return this.widget?.component?.component === 'ModalV2';
  }

  get isLegacyModal() {
    return this.widget?.component?.component === 'Modal';
  }

  get isInModalSlot() {
    return this.isNewModal && this.isOnCustomSlot;
  }

  get isOnCustomSlot() {
    return this.slotId.includes('-header') || this.slotId.includes('-footer');
  }

  get isDroppable() {
    return DropAreaEntity.dropAreaWidgets.includes(this.widgetType);
  }

  get slotType() {
    return this.slotId ? this.slotId.split('-').pop() : 'canvas';
  }

  get widgetType() {
    return this.widget?.component?.component || 'canvas';
  }
}
