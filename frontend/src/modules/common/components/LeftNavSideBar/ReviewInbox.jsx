import React from 'react';
import { NotificationCenter } from '@/_components/NotificationCenter';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

// The left nav's bell. The enterprise edition lists the version reviews waiting on the user here.
const ReviewInbox = (props) => <NotificationCenter {...props} />;

export default withEditionSpecificComponent(ReviewInbox, 'Appbuilder');
