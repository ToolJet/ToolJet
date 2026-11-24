import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ViewAsInterceptor } from '@modules/app-permissions/view-as.interceptor';
import { ViewAsService } from '@modules/app-permissions/view-as.service';
import { PermissionSubject, requesterSubject } from '@modules/app-permissions/types/view-as';
import { VIEW_AS_HEADER } from '@modules/app-permissions/constants';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';

const user = { id: 'user-1', organizationId: 'org-1' } as User;
const app = { id: 'app-1', organizationId: 'org-1' } as App;
const simulated: PermissionSubject = { kind: 'groups', groupIds: ['group-1'], simulated: true };

function run(resolve: ViewAsService['resolve'], headers: Record<string, string> = {}, mode = 'view') {
  const request = {
    user,
    tj_app: app,
    query: { mode },
    header: (name: string) => headers[name],
  } as Record<string, unknown>;
  const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
  const handle = jest.fn(() => of('handled'));
  const viewAsService = Object.assign(new ViewAsService(), { resolve: jest.fn(resolve) });
  const result = lastValueFrom(new ViewAsInterceptor(viewAsService).intercept(context, { handle }));
  return { request, handle, resolve: viewAsService.resolve, result };
}

/** @group platform */
describe('ViewAsInterceptor', () => {
  it('should resolve the header once with the request user, app and mode', async () => {
    const { resolve, result } = run(async () => simulated, { [VIEW_AS_HEADER]: 'group:group-1' });

    await expect(result).resolves.toBe('handled');
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve).toHaveBeenCalledWith({ user, app, mode: 'view', viewAs: 'group:group-1' });
  });

  it('should hand the resolved subject to the handler', async () => {
    const { request, result } = run(async () => simulated, { [VIEW_AS_HEADER]: 'group:group-1' });

    await result;
    expect(request.permissionSubject).toBe(simulated);
  });

  it('should evaluate the requester when the header is absent (CE behaviour)', async () => {
    const { request, resolve, result } = run((input) => new ViewAsService().resolve(input));

    await result;
    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ viewAs: undefined }));
    expect(request.permissionSubject).toEqual(requesterSubject(user));
  });

  it('should never run the handler when the header is rejected', async () => {
    const { handle, result } = run(
      async () => {
        throw new ForbiddenException('Only users who can edit this app can use View as');
      },
      { [VIEW_AS_HEADER]: 'group:group-1' }
    );

    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    expect(handle).not.toHaveBeenCalled();
  });
});
