// Single source of truth for "multi-environment actions are not covered by the current license".
//
// featureAccess.multiEnvironment is already false on an expired/basic plan (the server folds
// expiry into the boolean via LicenseBase.IsBasicPlan), but we also check the license status
// explicitly so an expired-but-flag-still-present edge case still locks. Returns false until
// featureAccess has actually loaded, so the UI never flashes a locked state on first paint.
export function isMultiEnvLicenseInvalid(featureAccess) {
  if (!featureAccess || Object.keys(featureAccess).length === 0) return false;
  const status = featureAccess.licenseStatus;
  return !featureAccess.multiEnvironment || status?.isExpired === true || status?.isLicenseValid === false;
}

// Message for the "environment action not covered by the current license" tooltip. Two distinct
// cases, same shape as the git-sync equivalent:
//   - Expired / invalid license → renew to restore access.
//   - Valid license whose plan simply doesn't include multi-environment → upgrading (not
//     renewing) is the fix.
export function getMultiEnvLicenseLockMessage(featureAccess) {
  const status = featureAccess?.licenseStatus;
  const isExpiredOrInvalid = status?.isExpired === true || status?.isLicenseValid === false;
  return isExpiredOrInvalid
    ? 'Multi-environments are available only in paid plans'
    : "Your plan doesn't support multiple environments";
}
