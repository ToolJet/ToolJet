import { AI_CHAT_WIDTH, LEFT_SIDEBAR_WIDTH } from '../appCanvasConstants';

// The AI chat panel is a fixed 400px: at 440 a 1280 screen left the canvas too little room while a
// build ran (2026-10-15). The canvas margin reads the same number.
describe('AI chat width', () => {
  it('is 400px, and the canvas reserves the same', () => {
    expect(AI_CHAT_WIDTH).toBe(400);
    expect(LEFT_SIDEBAR_WIDTH.tooljetai).toBe(AI_CHAT_WIDTH);
  });
});
