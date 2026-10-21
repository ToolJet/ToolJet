// Decides whether a gated feature shows a plan tag ("lock + Team plan") and what it says.
// The server owns plan names and the feature → plan map (GET /license/plan-catalog); this
// file only combines that catalog with the license state from GET /license/access.
// Display only: whether an action is allowed is still decided by each call site.

const UPGRADE_LABEL = 'Upgrade';
const AI_PLANS_WITH_OWN_KEYS = ['byok', 'selfhostai'];

const HIDDEN = Object.freeze({
  showTag: false,
  tagLabel: null,
  requiredPlan: null,
  isTrial: false,
  isHighestPlan: false,
});

export function isGateUnlocked(featureAccess, gateKey) {
  if (gateKey === 'byok') return AI_PLANS_WITH_OWN_KEYS.includes(featureAccess?.aiPlan);
  return featureAccess?.[gateKey] === true;
}

export function getPlanRank(catalog, planId) {
  return catalog?.plans?.findIndex((plan) => plan.id === planId) ?? -1;
}

export function isTrialLicense(licenseStatus) {
  return licenseStatus?.licenseType === 'trial' && !!licenseStatus?.isLicenseValid && !licenseStatus?.isExpired;
}

/**
 * @param {object} args
 * @param {string} args.edition ce | ee | cloud
 * @param {object} args.featureAccess GET /license/access response
 * @param {boolean} args.featuresLoaded
 * @param {{ plans: {id: string, label: string}[], gates: object }} args.catalog
 * @param {boolean} args.catalogLoaded
 * @param {string} args.gateKey
 * @param {boolean} [args.isUnlocked] Overrides the flag lookup when a call site already knows.
 */
export function getGateState({ edition, featureAccess, featuresLoaded, catalog, catalogLoaded, gateKey, isUnlocked }) {
  // Until both have loaded every flag reads false, so tags would flash for licensed users.
  if (edition === 'ce' || !featuresLoaded || !catalogLoaded) return HIDDEN;

  const requiredPlan = catalog?.plans?.find((plan) => plan.id === catalog?.gates?.[gateKey]) ?? null;
  if (!requiredPlan) return HIDDEN; // gate not offered on this deployment

  const unlocked = isUnlocked ?? isGateUnlocked(featureAccess, gateKey);
  const isTrial = isTrialLicense(featureAccess?.licenseStatus);
  const isHighestPlan = getPlanRank(catalog, requiredPlan.id) === catalog.plans.length - 1; // e.g. Enterprise only

  // During a trial the tag stays, naming the plan needed to keep the feature. Trials have no
  // plan tier, so the rank check below would otherwise turn every label into "Upgrade".
  if (isTrial) return { showTag: true, tagLabel: `${requiredPlan.label} plan`, requiredPlan, isTrial, isHighestPlan };
  if (unlocked) return HIDDEN;

  // Naming a plan the workspace already has (an Enterprise or custom license missing one
  // feature), or one we can't compare against, would be misleading.
  const currentRank = getPlanRank(catalog, featureAccess?.planTier);
  const requiredRank = getPlanRank(catalog, requiredPlan.id);
  const tagLabel = currentRank === -1 || currentRank >= requiredRank ? UPGRADE_LABEL : `${requiredPlan.label} plan`;

  return { showTag: true, tagLabel, requiredPlan, isTrial, isHighestPlan };
}
