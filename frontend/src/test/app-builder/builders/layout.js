import { applyDeclaredOverrides } from '../shared';

export function buildLayout(overrides = {}) {
  return applyDeclaredOverrides('layout', { type: 'desktop', width: 1200, height: 800 }, overrides, [
    'type',
    'width',
    'height',
  ]);
}
