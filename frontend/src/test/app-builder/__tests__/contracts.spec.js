import React from 'react';
import { screen } from '@testing-library/react';
import {
  AppBuilderTestSession,
  buildApp,
  buildComponent,
  buildLayout,
  buildQuery,
  defineAppBuilderScenario,
  loadCompatibilityFixture,
} from '..';

describe('App Builder test-kit contracts', () => {
  test('requires every product dimension and freezes the scenario', () => {
    expect(() => defineAppBuilderScenario({ name: 'incomplete' })).toThrow('id');

    const scenario = defineAppBuilderScenario({
      id: 'dropdown-editor-behavior',
      name: 'dropdown editor behavior',
      primarySeam: 'rtl',
      surface: 'app-editor',
      edition: 'ce',
      environment: 'development',
      layout: 'desktop',
      version: 'draft',
      transferPath: 'not-applicable',
      access: 'authenticated',
      capabilities: {},
    });

    expect(Object.isFrozen(scenario)).toBe(true);
    expect(scenario.primarySeam).toBe('rtl');
  });

  test('builders are deterministic, fresh, and reject unknown overrides', () => {
    expect(buildApp()).toEqual(buildApp());
    expect(buildApp()).not.toBe(buildApp());
    expect(buildComponent({ component: { component: 'DropdownV2' } }).component.component).toBe('DropdownV2');
    expect(buildQuery().name).toBe('query1');
    expect(buildLayout().type).toBe('desktop');
    expect(() => buildApp({ surprise: true })).toThrow('Unknown app override');
  });

  test('session exposes public store operations and owns rendered roots', async () => {
    const session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'session-canary',
        name: 'session canary',
        primarySeam: 'rtl',
        surface: 'app-editor',
        edition: 'ce',
        environment: 'development',
        layout: 'desktop',
        version: 'draft',
        transferPath: 'not-applicable',
        access: 'authenticated',
        capabilities: {
          network: [{ method: 'get', url: 'http://localhost/app-builder-canary', json: { ok: true } }],
        },
      }),
    });

    expect(Object.keys(session.store).sort()).toEqual(['act', 'read']);
    session.render(<button>Ready</button>);
    expect(screen.getByRole('button', { name: 'Ready' })).toBeInTheDocument();
    expect(session.store.read((state) => typeof state)).toBe('object');
    expect(session.cleanup).toBeUndefined();
    expect(session.controls).toBeUndefined();
    expect(await fetch('http://localhost/app-builder-canary').then((response) => response.json())).toEqual({
      ok: true,
    });
  });

  test('compatibility fixtures are checksum-verified and deeply frozen', () => {
    const fixture = loadCompatibilityFixture('minimal-app', { edition: 'ce' });
    expect(fixture.payload.name).toBe('Compatibility fixture');
    expect(Object.isFrozen(fixture.payload)).toBe(true);
  });
});
