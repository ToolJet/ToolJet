import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';

// Who page, component and query permissions are evaluated for. Normally the logged-in user; in a
// "View as" preview the Builder swaps in another workspace user or a set of groups. Only permission
// checks read this. The session, data source credentials and query data stay the requester's.
export type PermissionSubject =
  | { kind: 'user'; userId: string; simulated: boolean }
  // Treated like a user who belongs to exactly these groups.
  | { kind: 'groups'; groupIds: string[]; simulated: true };

export interface ResolveViewAsInput {
  user: User;
  app: App;
  mode?: string;
  // Raw VIEW_AS_HEADER value; absent when the request isn't simulating anyone.
  viewAs?: string;
}

export const requesterSubject = (user: User): PermissionSubject => ({
  kind: 'user',
  userId: user.id,
  simulated: false,
});
