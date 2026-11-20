// Where a verified signup lands: the home page prompt (CE keeps the dashboard). An explicit redirectTo wins.
export const getPostSignupPath = ({ edition, organizationSlug, redirectTo }) => {
  if (redirectTo) return redirectTo;
  return edition !== 'ce' && organizationSlug ? `/${organizationSlug}/home` : '/';
};
