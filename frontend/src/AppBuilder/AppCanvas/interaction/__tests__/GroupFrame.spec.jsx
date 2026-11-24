/**
 * The group frame follows its members by itself: nothing calls a re-measure. jsdom has no layout, so the members
 * report rects from RECTS; a member's re-render is a change of its inline style.
 */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';
import GroupFrame from '../GroupFrame';

// The chat mention button (an edition-specific component) is not what this spec is about.
jest.mock('../../ConfigHandle/MentionComponentInChat', () => () => null);

let RECTS;

const rectOf = ({ left, top, width, height }) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  x: left,
  y: top,
  toJSON() {},
});

// Renders the frame and lets its lazy chat button load.
let view;
const renderFrame = async () => {
  await act(async () => {
    view = render(<GroupFrame moduleId="canvas" />, {
      container: document.body.appendChild(document.createElement('div')),
    });
  });
};

const frameStyle = () => document.querySelector('.tj-group-frame')?.getAttribute('style');

describe('GroupFrame', () => {
  let restore;

  beforeEach(() => {
    RECTS = {
      layer: { left: 100, top: 50, width: 860, height: 800 },
      btnA: { left: 140, top: 80, width: 100, height: 40 },
      btnB: { left: 300, top: 150, width: 60, height: 30 },
    };
    document.body.innerHTML = `
      <div id="main-editor-canvas">
        <div class="real-canvas" data-parentId="canvas">
          <div class="rm-container" data-rect="layer">
            <div widgetid="btnA" class="moveable-box" data-rect="btnA"></div>
            <div widgetid="btnB" class="moveable-box" data-rect="btnB"></div>
          </div>
        </div>
      </div>`;
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      const key = this.getAttribute?.('data-rect');
      return key ? rectOf(RECTS[key]) : original.call(this);
    };
    restore = () => {
      Element.prototype.getBoundingClientRect = original;
    };

    seedApp({
      btnA: componentDefinition('btnA', 'button1', 'Button'),
      btnB: componentDefinition('btnB', 'button2', 'Button'),
    });
    useStore.getState().setSelectedComponents(['btnA', 'btnB']);
  });

  afterEach(() => {
    view?.unmount();
    view = null;
    restore();
    document.body.innerHTML = '';
  });

  it('frames the selected components where they are drawn, in their own layer', async () => {
    await renderFrame();
    const frame = document.querySelector('.tj-group-frame');
    expect(frame.parentElement).toBe(document.querySelector('.rm-container'));
    // From (40, 30) to (260, 130) relative to the layer, one pixel wider and taller for its closing lines.
    expect(frameStyle()).toContain('translate(40px, 30px)');
    expect(frameStyle()).toContain('width: 221px');
    expect(frameStyle()).toContain('height: 101px');
  });

  it('follows a member that moves or resizes, without being asked to re-measure', async () => {
    await renderFrame();
    expect(frameStyle()).toContain('width: 221px');

    // btnB re-renders wider and lower (a new layout, a canvas resize, a dynamic-height reflow …).
    RECTS.btnB = { left: 300, top: 200, width: 160, height: 30 };
    act(() => {
      document.querySelector('[widgetid="btnB"]').style.width = '160px';
    });

    await waitFor(() => expect(frameStyle()).toContain('width: 321px'));
    expect(frameStyle()).toContain('height: 151px');
    expect(frameStyle()).toContain('translate(40px, 30px)');
  });

  it('is not drawn for a single selected component', async () => {
    useStore.getState().setSelectedComponents(['btnA']);
    await renderFrame();
    expect(document.querySelector('.tj-group-frame')).toBeNull();
  });
});
