import '@/test/setupMsw';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import ReleaseConfirmation from '../ReleaseConfirmation';

const pinsUrl = `${config.apiUrl}/apps/app1/versions/ver1/library-pins`;
const pin = (overrides) => ({
  consumerQueryName: 'getCustomer',
  libraryQueryName: 'customerLookup',
  pinnedVersion: 'v1',
  latestVersion: 'v1',
  siblings: [],
  ...overrides,
});
const renderDialog = (props) =>
  render(
    <ReleaseConfirmation show appId="app1" versionId="ver1" onClose={jest.fn()} onConfirm={jest.fn()} {...props} />
  );

describe('ReleaseConfirmation library notices', () => {
  it('warns when a query is pinned to an older released version', async () => {
    server.use(
      http.get(pinsUrl, () => HttpResponse.json({ pins: [pin({ pinnedVersion: 'v1', latestVersion: 'v3' })] }))
    );
    renderDialog();

    expect(await screen.findByText('getCustomer uses customerLookup v1; v3 is available.')).toBeInTheDocument();
  });

  it('does not warn for pins on the latest version or on draft', async () => {
    server.use(
      http.get(pinsUrl, () =>
        HttpResponse.json({
          pins: [pin(), pin({ consumerQueryName: 'other', pinnedVersion: 'draft', latestVersion: 'v3' })],
        })
      )
    );
    renderDialog();

    await waitFor(() => expect(screen.getByText(/Are you sure you want to release/)).toBeInTheDocument());
    expect(screen.queryByTestId('library-release-notices')).not.toBeInTheDocument();
  });

  it('says which version a called sibling will run', async () => {
    server.use(
      http.get(pinsUrl, () =>
        HttpResponse.json({ pins: [pin({ siblings: [{ name: 'formatName', runsVersion: 'v2' }] })] })
      )
    );
    renderDialog();

    expect(await screen.findByText('customerLookup v1 calls formatName; it will run v2.')).toBeInTheDocument();
  });

  it('shows no notice section when there are no pins', async () => {
    server.use(http.get(pinsUrl, () => HttpResponse.json({ pins: [] })));
    renderDialog();

    await waitFor(() => expect(screen.getByText(/Are you sure you want to release/)).toBeInTheDocument());
    expect(screen.queryByTestId('library-release-notices')).not.toBeInTheDocument();
  });

  it('shows no notice and still releases when the pins request fails', async () => {
    server.use(http.get(pinsUrl, () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    const onConfirm = jest.fn();
    renderDialog({ onConfirm });

    await waitFor(() => expect(screen.getByText(/Are you sure you want to release/)).toBeInTheDocument());
    expect(screen.queryByTestId('library-release-notices')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("drops the previous version's notices when the version changes or the dialog closes", async () => {
    server.use(
      http.get(pinsUrl, () => HttpResponse.json({ pins: [pin({ pinnedVersion: 'v1', latestVersion: 'v3' })] })),
      http.get(`${config.apiUrl}/apps/app1/versions/ver2/library-pins`, () => HttpResponse.json({ pins: [] }))
    );
    const props = { show: true, appId: 'app1', versionId: 'ver1', onClose: jest.fn(), onConfirm: jest.fn() };
    const { rerender } = render(<ReleaseConfirmation {...props} />);
    const old = 'getCustomer uses customerLookup v1; v3 is available.';
    expect(await screen.findByText(old)).toBeInTheDocument();

    rerender(<ReleaseConfirmation {...props} versionId="ver2" />);
    await waitFor(() => expect(screen.queryByText(old)).not.toBeInTheDocument());

    rerender(<ReleaseConfirmation {...props} versionId="ver1" />);
    expect(await screen.findByText(old)).toBeInTheDocument();
    rerender(<ReleaseConfirmation {...props} show={false} />);
    rerender(<ReleaseConfirmation {...props} versionId="ver2" />);
    expect(screen.queryByText(old)).not.toBeInTheDocument();
  });

  it('lists each notice once, including a pin that is out of date and has siblings', async () => {
    const sibling = { name: 'formatName', runsVersion: 'v2' };
    server.use(
      http.get(pinsUrl, () =>
        HttpResponse.json({
          pins: [
            pin({ consumerQueryName: 'a', siblings: [sibling] }),
            pin({ consumerQueryName: 'b', siblings: [sibling] }),
            pin({ consumerQueryName: 'c', libraryQueryName: 'other', latestVersion: 'v4', siblings: [sibling] }),
          ],
        })
      )
    );
    renderDialog();

    expect(await screen.findByText('c uses other v1; v4 is available.')).toBeInTheDocument();
    expect(screen.getAllByText('customerLookup v1 calls formatName; it will run v2.')).toHaveLength(1);
    expect(screen.getByText('other v1 calls formatName; it will run v2.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
