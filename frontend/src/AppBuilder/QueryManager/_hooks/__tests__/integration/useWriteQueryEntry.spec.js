import '@/test/setupMsw';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { useWriteQueryEntry } from '@/AppBuilder/QueryManager/_hooks/useWriteQueryEntry';

let reads;
let focus;
beforeEach(() => {
  seedApp({});
  reads = 0;
  focus = jest.fn();
  useStore.setState((state) => ({
    queryPanel: {
      ...state.queryPanel,
      selectedQuery: { id: 'query-orbit', name: 'loadReadings' },
      selectedDataSource: { id: 'source-ridge', name: 'Observatory', kind: 'postgresql' },
    },
    ai: {
      ...state.ai,
      currentConversation: 'generate',
      conversation: { id: 'chat-empty', appId: 'app-observatory' },
      inputMessage: 'Compare altitude',
      _chatInputFocusFn: focus,
    },
  }));
  server.use(
    http.get('http://localhost:3000/api/ai/conversations', () => {
      reads++;
      return HttpResponse.json([{ id: 'chat-empty', messageCount: 0 }]);
    })
  );
});

// Query entry preserves the draft and records the scope without duplicating the same mention.
test.each(['query', 'transformation'])('opens the %s entry and focuses repeated presses', async (scope) => {
  const { result, unmount } = renderHook(() => useWriteQueryEntry(scope));
  await act(async () => result.current.openChat());
  expect(useStore.getState()).toMatchObject({
    selectedSidebarItem: 'tooljetai',
    ai: {
      inputMessage: `Compare altitude @loadReadings${scope === 'transformation' ? '.transformation' : ''} `,
      generateQuerySource: {
        queryId: 'query-orbit',
        queryName: 'loadReadings',
        datasourceId: 'source-ridge',
        datasourceName: 'Observatory',
        datasourceType: 'postgresql',
        scope,
      },
    },
  });
  expect(result.current.isPressed).toBe(true);
  await act(async () => result.current.openChat());
  expect(reads).toBe(1);
  await waitFor(() => expect(focus).toHaveBeenCalledTimes(2));
  act(() => useStore.getState().ai.setInputMessage('New observation'));
  expect(result.current.isPressed).toBe(false);
  unmount();
});
