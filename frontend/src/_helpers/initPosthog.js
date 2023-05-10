import { posthog } from 'posthog-js';

export default function initPosthog(currentUser) {
  console.log('inside', currentUser);
  if (currentUser) {
    posthog.init('phc_26ABY7KUsjfqamS7V0WxcLzfTr6AT4Du21CAEvCISo7', {
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
