import React, { useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { DynamicIcon } from 'lucide-react/dynamic.mjs';

import useStore from '@/AppBuilder/_stores/store';

/**
 * "Agent is building" overlay for the editor. While an AI build or modification is in progress
 * (ai.isLoading in the generate conversation), it disables the canvas and the left icon toolbar and
 * warns the user not to refresh — a mid-build refresh interrupts a live direct-build and can leave a
 * half-applied app. Applies to new builds and edits of existing apps alike.
 *
 * The editor z-order is: canvas (auto) < AI-chat popover (z-2) < left toolbar (z-10) < header (z-12).
 * Because the chat sits BELOW the toolbar, one overlay can't cover the toolbar and still keep the chat
 * usable. So we use two dim layers:
 *   - canvas layer at z-1 — above the canvas, BELOW the chat popover, so the chat and its live progress
 *     stay visible and interactive. Carries the message card.
 *   - toolbar layer at z-11 — above the toolbar (z-10), but x-clamped to the 48px toolbar strip so it
 *     never overlaps the chat panel to its right.
 * Both mounted inside #main-editor-canvas (which spans the editor from 0,0), so absolute offsets map to
 * viewport coordinates without a fixed-position/transform-ancestor gamble.
 */
const TOOLBAR_W = 48; // ToolJet left icon strip width
const HEADER_H = 48; // editor header height

const AgentBuildingOverlay = () => {
  const isBuilding = useStore((state) => Boolean(state.ai?.isLoading && state.ai?.currentConversation === 'generate'));

  useEffect(() => {
    if (!isBuilding) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isBuilding]);

  if (!isBuilding) return null;

  const block = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const dim = {
    position: 'absolute',
    top: HEADER_H,
    bottom: 0,
    background: 'rgba(17, 24, 39, 0.35)',
    cursor: 'not-allowed',
  };

  return (
    <>
      {/* Left toolbar layer — above the toolbar (z-10), clamped to the strip so it never covers the chat */}
      <div
        style={{ ...dim, left: 0, width: TOOLBAR_W, zIndex: 11 }}
        onClickCapture={block}
        onMouseDownCapture={block}
        data-cy="agent-building-overlay-toolbar"
      />

      {/* Canvas layer — below the AI chat popover (z-2), so the chat stays usable; carries the message.
          The card is centered in the canvas region to the RIGHT of the chat panel (which the chat, at
          z-2, overlays on the left) so it stays clear of the open chat instead of being clipped by it. */}
      <div
        style={{
          ...dim,
          left: TOOLBAR_W,
          right: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: 438,
        }}
        onClickCapture={block}
        onMouseDownCapture={block}
        data-cy="agent-building-overlay"
      >
        <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-background-surface-layer-01 tw-px-4 tw-py-3 tw-shadow-lg">
          <DynamicIcon name="loader-circle" size={18} className="tw-animate-spin tw-text-icon-accent-primary" />
          <div className="tw-flex tw-flex-col">
            <span className="tw-font-body-large tw-text-text-default" style={{ fontWeight: 600 }}>
              Agent is building your app
            </span>
            <span className="tw-font-body-default tw-text-text-placeholder">
              Please don&apos;t refresh or make edits until it finishes.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentBuildingOverlay;
