// The Record list's closest native widget is the List view: the pack keeps the native event and exposed names
// beside its own (EVENT_PARITY.md), so an app moved from a List view keeps its handlers and bindings. That the event
// fires and its handler reads the new value is events.spec (eventTriggers.jsx).
import { listviewConfig } from '@/AppBuilder/WidgetManager/widgets/listview';
import { shadRecordListConfig } from '@/AppBuilder/WidgetManager/widgets/shadRecordList';

describe('Record list parity with the native List view', () => {
  it('has every native List view event', () => {
    for (const event of Object.keys(listviewConfig.events)) expect(shadRecordListConfig.events).toHaveProperty(event);
  });
  it('exposes the native selection names', () => {
    for (const key of ['selectedRecord', 'selectedRecordId', 'selectedRow', 'selectedRowId'])
      expect(shadRecordListConfig.exposedVariables).toHaveProperty(key);
  });
});
