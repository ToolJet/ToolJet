/**
 * Represents a widget being dragged.
 */
export class DragEntity {
  constructor(widget) {
    this.widget = widget;
    this.id = widget?.id || null;
    this.left = widget.left;
    this.top = widget.top;
  }

  get widgetType() {
    return this.widget?.component?.component || null;
  }
}
