import { BehaviorSubject } from 'rxjs';

const currentOrgSubject = new BehaviorSubject({
  organization_id: null,
  organization: null,
  super_admin: null,
  admin: null,
  group_permissions: null,
});

const currentOrgService = {
  update: function (org) {
    currentOrgSubject.next(org);
  },
};

export { currentOrgService, currentOrgSubject };
