export const RESTRICTED_WIDGETS_CONFIG = {
  Form: ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Accordion'],
  Kanban_card: ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Listview', 'Container', 'Accordion', 'Table'],
  Calendar: ['Calendar', 'Kanban'],
  Container: ['Calendar', 'Kanban'],
  Modal: ['Calendar', 'Kanban'],
  ModalV2: ['Calendar', 'Kanban'],
  ModalSlot: ['Calendar', 'Kanban', 'Table', 'Listview', 'Container', 'Accordion'],
  Tabs: ['Calendar', 'Kanban'],
  Kanban_popout: ['Calendar', 'Kanban'],
  Listview: ['Calendar', 'Kanban'],
};

export const RESTRICTED_WIDGET_SLOTS_CONFIG = {
  header: ['Calendar', 'Kanban', 'Table', 'Listview', 'Container', 'Accordion'],
  footer: ['Calendar', 'Kanban', 'Table', 'Listview', 'Container', 'Accordion'],
};
