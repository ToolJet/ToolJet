import { expect } from 'chai';

import { createApp } from '../../../src/lib/app/remote';
import type { Session } from '../../../src/lib/app/session';

/* `tooljet app init --create` makes a Code mode app, and never links a Visual one the server made instead. */

function fakeSession(reply: Record<string, unknown>): Session & { bodies: any[] } {
  const bodies: any[] = [];
  return {
    bodies,
    api: async (_path: string, init?: { method?: string; body?: unknown }) => {
      bodies.push(init?.body);
      return reply;
    },
  } as unknown as Session & { bodies: any[] };
}

describe('createApp', () => {
  it('asks ToolJet for a Code mode app', async () => {
    const session = fakeSession({ id: 'app-1', buildMode: 'code' });
    const created = await createApp(session, 'Orders');
    expect(created).to.deep.equal({ id: 'app-1' });
    expect(session.bodies).to.deep.equal([{ name: 'Orders', type: 'front-end', buildMode: 'code' }]);
  });

  it('accepts the snake_case field', async () => {
    expect(await createApp(fakeSession({ id: 'app-1', build_mode: 'code' }), 'Orders')).to.deep.equal({ id: 'app-1' });
  });

  it('refuses an app the server stored as visual', async () => {
    let error: Error | undefined;
    await createApp(fakeSession({ id: 'app-1', buildMode: 'visual' }), 'Orders').catch((e) => (error = e));
    expect(error?.message).to.match(/created "Orders" \(app-1\) as a Visual app/);
  });

  it('refuses a reply with no build mode (a server without Code mode)', async () => {
    let error: Error | undefined;
    await createApp(fakeSession({ id: 'app-1' }), 'Orders').catch((e) => (error = e));
    expect(error?.message).to.match(/Visual app/);
  });
});
