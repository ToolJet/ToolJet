import React, { useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { DynamicIcon } from 'lucide-react/dynamic.mjs';

import useStore from '@/AppBuilder/_stores/store';

/**
 * "Agent is building" overlay for the editor. While an AI build or modification is in progress
 * (ai.isLoading in the generate conversation), it disables the canvas and the editing panels and
 * warns the user not to refresh — a mid-build refresh interrupts a live direct-build and can leave a
 * half-applied app. Applies to new builds and edits of existing apps alike.
 *
 * The editor z-order is: canvas (auto) < AI-chat popover (z-2) < left toolbar (z-10) < header (z-12).
 * One dim layer, at z-1 — above the canvas but BELOW the chat popover, so the chat and its live
 * progress stay visible and interactive. It carries the message card, and starts at x=48 so it never
 * covers the left toolbar. Mounted inside #main-editor-canvas (which spans the editor from 0,0), so
 * absolute offsets map to viewport coordinates without a fixed-position/transform-ancestor gamble.
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

  // Disable the surrounding editor chrome IN PLACE — the right properties panel and the queries
  // panel — by fading them and blocking clicks, instead of laying a dark rectangle over each (which
  // read as odd). Toggled imperatively because these are separate React subtrees from this overlay.
  // The canvas itself keeps its dim layer below.
  //
  // The left sidebar is deliberately NOT in this list. It edits nothing — it is the chat, the
  // debugger, version history — and disabling it removed the only way to see what the agent was
  // doing or to recover if the build indicator ever got stuck, since the chat lives behind it.
  useEffect(() => {
    if (!isBuilding) return undefined;
    const selectors = ['.right-sidebar', '[class*="query-manager"]'];
    const restore = [];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        restore.push([el, el.style.opacity, el.style.pointerEvents]);
        el.style.opacity = '0.45';
        el.style.pointerEvents = 'none';
      });
    });
    return () =>
      restore.forEach(([el, opacity, pointerEvents]) => {
        el.style.opacity = opacity;
        el.style.pointerEvents = pointerEvents;
      });
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
