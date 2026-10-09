import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

/**
 * CE base for the Profile settings "Notifications" card. The card configures AI build
 * notifications, and the AI builder is an enterprise feature, so CE renders nothing —
 * the enterprise implementation lives in ee/modules/AiBuilder/components.
 */
const ProfileNotificationsCard = () => null;

export default withEditionSpecificComponent(ProfileNotificationsCard, 'AiBuilder');
