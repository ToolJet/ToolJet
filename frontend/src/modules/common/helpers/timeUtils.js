const moment = require('moment-timezone');
/**
 * Get the user's country based on their time zone.
 * @param {string} userTimeZone - The user's time zone.
 * @returns {string} The user's country or the original time zone if not found.
 */
export function getCountryByTimeZone() {
  let userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  /* Some times the browser gives Asia/Calcutta */
  if (userTimeZone === 'Asia/Calcutta') {
    userTimeZone = 'Asia/Kolkata';
  }
  // Get a list of countries from moment-timezone
  const countries = moment.tz.countries();

  // Iterate through the countries and check if the time zone is associated with any country
  for (const country of countries) {
    const timeZones = moment.tz.zonesForCountry(country);

    if (timeZones.includes(userTimeZone)) {
      // Use Intl.DisplayNames to get the full country name
      const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(country);
      return countryName;
    }
  }

  // Return the original time zone if no matching country is found
  return userTimeZone;
}
