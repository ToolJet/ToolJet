import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

// The left nav's review bell, beside the notifications bell. Enterprise lists the version reviews waiting on the
// user; the community edition has no reviews, so nothing.
const ReviewInbox = () => null;

export default withEditionSpecificComponent(ReviewInbox, 'Appbuilder');
