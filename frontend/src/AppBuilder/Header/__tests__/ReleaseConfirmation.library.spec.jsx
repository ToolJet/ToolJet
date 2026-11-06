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
  releasedVersion: 'v1',
  ...overrides,
});
const renderDialog = (props) =>
  render(
    <ReleaseConfirmation show appId="app1" versionId="ver1" onClose={jest.fn()} onConfirm={jest.fn()} {...props} />
  );

describe('ReleaseConfirmation library notices', () => {
  it('warns when a query is not pinned to the released version', async () => {
    server.use(
      http.get(pinsUrl, () => HttpResponse.json({ pins: [pin({ pinnedVersion: 'v1', releasedVersion: 'v3' })] }))
    );
    renderDialog();

    expect(
      await screen.findByText('getCustomer uses customerLookup v1; the released version is v3.')
    ).toBeInTheDocument();
  });

  it('does not warn for a pin on the released version', async () => {
    server.use(http.get(pinsUrl, () => HttpResponse.json({ pins: [pin()] })));
    renderDialog();

    await waitFor(() => expect(screen.getByText(/Are you sure you want to release/)).toBeInTheDocument());
    expect(screen.queryByTestId('library-release-notices')).not.toBeInTheDocument();
  });

  it('warns for a draft pin and for a query with no released version', async () => {
    server.use(
      http.get(pinsUrl, () =>
        HttpResponse.json({
          pins: [
            pin({ consumerQueryName: 'a', pinnedVersion: 'draft', releasedVersion: 'v3' }),
            pin({ consumerQueryName: 'b', releasedVersion: null }),
          ],
        })
      )
    );
    renderDialog();

    expect(await screen.findByText('a uses customerLookup draft; the released version is v3.')).toBeInTheDocument();
    expect(screen.getByText('b uses customerLookup v1; the released version is none.')).toBeInTheDocument();
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
      http.get(pinsUrl, () => HttpResponse.json({ pins: [pin({ pinnedVersion: 'v1', releasedVersion: 'v3' })] })),
      http.get(`${config.apiUrl}/apps/app1/versions/ver2/library-pins`, () => HttpResponse.json({ pins: [] }))
    );
    const props = { show: true, appId: 'app1', versionId: 'ver1', onClose: jest.fn(), onConfirm: jest.fn() };
    const { rerender } = render(<ReleaseConfirmation {...props} />);
    const old = 'getCustomer uses customerLookup v1; the released version is v3.';
    expect(await screen.findByText(old)).toBeInTheDocument();

    rerender(<ReleaseConfirmation {...props} versionId="ver2" />);
    await waitFor(() => expect(screen.queryByText(old)).not.toBeInTheDocument());

    rerender(<ReleaseConfirmation {...props} versionId="ver1" />);
    expect(await screen.findByText(old)).toBeInTheDocument();
    rerender(<ReleaseConfirmation {...props} show={false} />);
    rerender(<ReleaseConfirmation {...props} versionId="ver2" />);
    expect(screen.queryByText(old)).not.toBeInTheDocument();
  });

  it('lists each notice once', async () => {
    server.use(
      http.get(pinsUrl, () =>
        HttpResponse.json({
          pins: [
            pin({ consumerQueryName: 'a', releasedVersion: 'v3' }),
            pin({ consumerQueryName: 'a', releasedVersion: 'v3' }),
            pin({ consumerQueryName: 'c', libraryQueryName: 'other', releasedVersion: 'v4' }),
          ],
        })
      )
    );
    renderDialog();

    expect(await screen.findByText('c uses other v1; the released version is v4.')).toBeInTheDocument();
    expect(screen.getAllByText('a uses customerLookup v1; the released version is v3.')).toHaveLength(1);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
