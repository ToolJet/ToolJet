// Self-test for the shared test infrastructure: zustand auto-reset, MSW at the
// fetch boundary, asset/edition parity, and custom render. If this suite breaks,
// every other suite's isolation guarantees are suspect.
import React from 'react';
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { create } from 'zustand';
import { server } from '@/test/msw/server';
import { render, screen } from '@/test/test-utils';

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

describe('zustand store isolation', () => {
  test('a test can mutate a store', () => {
    useCounterStore.getState().increment();
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(2);
  });

  test('the next test sees the initial state again', () => {
    expect(useCounterStore.getState().count).toBe(0);
  });
});

describe('MSW HTTP boundary', () => {
  test('intercepts a declared request and returns its response', async () => {
    server.use(http.get('http://localhost:3000/api/example', () => HttpResponse.json({ ok: true })));

    const response = await fetch('http://localhost:3000/api/example');

    expect(await response.json()).toEqual({ ok: true });
  });
});

describe('asset mocks (SVGR + ?url parity with the bundlers)', () => {
  test('plain .svg imports render as a React component', () => {
    const Logo = require('@assets/images/Logomark.svg').default;
    const { container } = render(<Logo className="logo" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('logo');
  });

  test('.svg?url imports resolve to a URL string', () => {
    const url = require('@assets/images/no-apps.svg?url');
    expect(url).toBe('test-file-stub');
  });

  test('binary asset imports resolve to a URL string', () => {
    const url = require('@assets/images/avatar.png');
    expect(url).toBe('test-file-stub');
  });
});

describe('edition-gated module resolution', () => {
  test('@cloud/modules maps to emptyModule (parity with resolve.fallback)', () => {
    const mod = require('@cloud/modules');
    expect(mod.name).toBe('Empty Module');
  });
});

describe('custom render', () => {
  test('mounts components inside a router', () => {
    const { Link } = require('react-router-dom');
    render(<Link to="/somewhere">go somewhere</Link>, { route: '/start' });
    expect(screen.getByRole('link', { name: 'go somewhere' })).toBeInTheDocument();
  });
});
