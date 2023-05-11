import { posthog } from 'posthog-js';

export default function initPosthog(currentUser) {
  console.log('inside', currentUser);
  if (currentUser) {
    posthog.init('1OhSAF2367nMhuGI3cLvE6m5D0PJPBEA5zR5JFTM-yw', {
      api_host: 'https://app.posthog.com',
      autocapture: false,
    });

    posthog.identify(
      currentUser.email, // distinct_id, required
      { name: `${currentUser.first_name} ${currentUser.last_name}`, time: currentUser.created_at }
    );
    //incase if the user properties have default time property.
    posthog.register({ user_created_at: currentUser.created_at });
  }
}
