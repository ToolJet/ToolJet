/**
 * What a click on a left rail icon shows: its panel, or, on the open panel's own icon, nothing (the sidebar closes).
 * When the chat is the sidebar's home: a panel opened over the chat (Security, App history...) closes back to
 * the chat instead of closing the chat with it. `overChat` says whether the open panel was opened over the chat.
 */
export const railClick = ({ item, selected, open, pinned, codeMode, overChat }) => {
  if (item === selected && open && !pinned) {
    return { show: codeMode && overChat && item !== 'tooljetai' ? 'tooljetai' : null, overChat: false };
  }
  const fromChat = open && selected === 'tooljetai';
  return { show: item, overChat: codeMode && item !== 'tooljetai' && (overChat || fromChat) };
};
