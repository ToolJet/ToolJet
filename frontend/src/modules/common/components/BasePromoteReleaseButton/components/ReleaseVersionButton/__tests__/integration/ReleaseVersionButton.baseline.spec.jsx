/**
 * The Release button in the version menu must tell the server which released version its confirmation dialog showed.
 * The dialog says "Releasing v3 will override v2". If another session releases v1 while it is open, the server can
 * only refuse the release (409) when the request carries `expectedReleasedVersionId`. This button used to send only
 * `versionToBeReleased`, so the server skipped the check and v3 silently replaced v1.
 *
 * Nothing ToolJet-owned is mocked: the real button, the real ReleaseConfirmation, the real store and the real
 * appsService. HTTP goes through MSW; react-hot-toast is the one external adapter that is replaced.
 */
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, userEvent, waitFor, within } from '@/test/test-utils';
import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services';
import ReleaseVersionButton from '../../ReleaseVersionButton';

jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.error = jest.fn();
  return { __esModule: true, default: toast, toast };
});

const API = 'http://localhost:3000/api';
const APP_ID = 'app-1';
const V1 = { id: 'version-1', name: 'v1' };
const V2 = { id: 'version-2', name: 'v2' };
const V3 = { id: 'version-3', name: 'v3' };

const seedEditor = ({ releasedVersionId }) => {
  authenticationService.updateCurrentSession({
    ...authenticationService.currentSessionValue,
    user_permissions: { app_release: true },
  });
  useStore.setState({
    appId: APP_ID,
    releasedVersionId,
    selectedVersion: V3,
    currentVersionId: V3.id,
    versionsPromotedToEnvironment: [V1, V2, V3],
    developmentVersions: [],
  });
};

const captureReleaseRequests = (respond = () => HttpResponse.json({})) => {
  const bodies = [];
  server.use(
    http.put(`${API}/apps/${APP_ID}/release`, async ({ request }) => {
      bodies.push(await request.json());
      return respond(bodies.length);
    })
  );
  return bodies;
};

// The version menu renders one of these per version row.
const openReleaseDialog = async (user) => {
  render(<ReleaseVersionButton version={V3} variant="inline" />);
  await user.click(screen.getByRole('button', { name: 'Release' }));
  return screen.findByText(/Releasing version v3 will override|Are you sure you want to release version v3/);
};

describe('Release from the version menu', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  // Break this catches: the request carrying only versionToBeReleased, so the server never compares against the
  // released version the dialog showed and a release made by someone else in between is replaced unseen.
  it('sends the released version its dialog showed with the release request', async () => {
    seedEditor({ releasedVersionId: V2.id });
    const bodies = captureReleaseRequests();

    await openReleaseDialog(user);
    await user.click(screen.getByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ versionToBeReleased: V3.id, expectedReleasedVersionId: V2.id });
  });

  // Break this catches: an app with nothing released sending no baseline, so a release by someone else since the
  // dialog opened goes through. The server reads '' as "nothing is live".
  it('sends an empty baseline when nothing is released yet', async () => {
    seedEditor({ releasedVersionId: null });
    const bodies = captureReleaseRequests();

    await openReleaseDialog(user);
    await user.click(screen.getByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ versionToBeReleased: V3.id, expectedReleasedVersionId: '' });
  });

  // Break this catches: a 409 being handled as any other failure, which closes the dialog and leaves the stale
  // "will override v2" text, instead of showing the person what the release replaces now.
  describe('when another version went live while the dialog was open', () => {
    const refuseThenAccept = (count) =>
      count === 1
        ? HttpResponse.json(
            { statusCode: 409, message: 'Another version was released after you opened this.' },
            { status: 409 }
          )
        : HttpResponse.json({});

    beforeEach(() => {
      seedEditor({ releasedVersionId: V2.id });
      // The app as the server now has it: v1 was released by the other session.
      server.use(http.get(`${API}/apps/${APP_ID}`, () => HttpResponse.json({ current_version_id: V1.id })));
    });

    it('keeps the dialog open and shows the version the release now replaces', async () => {
      captureReleaseRequests(refuseThenAccept);

      await openReleaseDialog(user);
      await user.click(screen.getByRole('button', { name: 'Yes' }));

      const dialog = await screen.findByRole('dialog');
      expect(await within(dialog).findByText(/will override v1/)).toBeInTheDocument();
      expect(within(dialog).queryByText(/will override v2/)).not.toBeInTheDocument();
    });

    it('releases on the second confirmation against the version it now shows', async () => {
      const bodies = captureReleaseRequests(refuseThenAccept);

      await openReleaseDialog(user);
      await user.click(screen.getByRole('button', { name: 'Yes' }));
      await within(await screen.findByRole('dialog')).findByText(/will override v1/);
      await user.click(screen.getByRole('button', { name: 'Yes' }));

      await waitFor(() => expect(bodies).toHaveLength(2));
      expect(bodies[1]).toEqual({ versionToBeReleased: V3.id, expectedReleasedVersionId: V1.id });
    });
  });
});
