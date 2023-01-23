import { BehaviorSubject } from 'rxjs';

const currentOrgSubject = new BehaviorSubject();

const currentOrgService = {
  update: function (org) {
    currentOrgSubject.next(org);
  },
};

export { currentOrgService, currentOrgSubject };
