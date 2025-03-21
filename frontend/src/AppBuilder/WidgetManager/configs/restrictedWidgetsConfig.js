export const RESTRICTED_WIDGETS_CONFIG = {
  Form: ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Listview', 'Container'],
  Kanban_card: ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Listview', 'Container', 'Table'],
  Calendar: ['Calendar', 'Kanban'],
  Container: ['Calendar', 'Kanban'],
  Modal: ['Calendar', 'Kanban'],
  ModalV2: ['Calendar', 'Kanban'],
  ModalSlot: ['Calendar', 'Kanban', 'Table', 'Listview', 'Container'],
  Tabs: ['Calendar', 'Kanban'],
  Kanban_popout: ['Calendar', 'Kanban'],
  Listview: ['Calendar', 'Kanban'],
};

export const RESTRICTED_WIDGET_SLOTS_CONFIG = {
  header: ['Calendar', 'Kanban', 'Table', 'Listview', 'Container'],
  footer: ['Calendar', 'Kanban', 'Table', 'Listview', 'Container'],
};
