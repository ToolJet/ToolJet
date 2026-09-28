import { useCallback, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

// Suffix that scopes an AI request to a query's transformation layer only. Kept here because both
// entry points (the header's "Write query" button and the transformation ✨) and the chat's mention
// parser have to agree on it.
export const TRANSFORMATION_MENTION_SUFFIX = '.transformation';

/**
 * Builds the mention text for a query, optionally scoped to its transformation.
 */
export const buildQueryMention = (queryName, scope) =>
  `@${queryName}${scope === 'transformation' ? TRANSFORMATION_MENTION_SUFFIX : ''}`;

/**
 * True when `text` already references `queryName` at the requested scope. A bare "@getOrders" and a
 * scoped "@getOrders.transformation" are distinct references — pressing ✨ while only the bare one is
 * present should still add the scoped mention.
 */
export const hasQueryMention = (text, queryName, scope) => {
  if (!queryName || !text) return false;
  const escaped = queryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suffix = scope === 'transformation' ? '\\.transformation' : '';
  return new RegExp(`(?:^|[ ,])@${escaped}${suffix}(?=$|[ ,])`).test(text);
};

/**
 * Shared behaviour behind the two AI entry points on the query editor: open the AI panel, remember
 * which query (and which part of it) the request came from, and pre-fill the chat with the mention.
 *
 * @param {'query'|'transformation'} scope Which part of the query the AI may act on.
 */
export const useWriteQueryEntry = (scope = 'query') => {
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const queryName = selectedQuery?.name ?? '';
  const isQueryMentioned = useStore((state) => hasQueryMention(state.ai?.inputMessage ?? '', queryName, scope));
  const [pressedForQuery, setPressedForQuery] = useState(null);

  const isPressed = pressedForQuery === queryName && isQueryMentioned;

  const openChat = useCallback(async () => {
    posthogHelper.captureEvent(scope === 'transformation' ? 'click_write_transformation' : 'click_generate_query', {
      dataSource: selectedDataSource?.kind,
    });
    const store = useStore.getState();

    store.toggleLeftSidebar(true);
    store.setSelectedSidebarItem('tooljetai');

    if (isPressed) {
      requestAnimationFrame(() => store.ai.triggerChatInputFocus());
      return;
    }

    setPressedForQuery(queryName);
    store.ai.setGenerateQuerySource({
      queryName,
      queryId: selectedQuery?.id,
      datasourceId: selectedDataSource?.id,
      datasourceName: selectedDataSource?.name,
      datasourceType: selectedDataSource?.kind,
      scope,
    });
    await store.ai.createNewConversation();

    const current = store.ai.inputMessage;
    const mention = `${buildQueryMention(queryName, scope)} `;
    store.ai.setInputMessage(current ? `${current} ${mention}` : mention);

    requestAnimationFrame(() => store.ai.triggerChatInputFocus());
  }, [isPressed, queryName, scope, selectedDataSource, selectedQuery?.id]);

  return { openChat, isPressed, queryName, selectedQuery, selectedDataSource };
};
