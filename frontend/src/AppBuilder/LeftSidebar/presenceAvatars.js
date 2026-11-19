/**
 * One avatar per person: the same user in several tabs (or windows) is one presence each, which showed as "TD TD +1".
 * People are matched by email, else by name; the first entry wins, so the current user (passed first) keeps theirs.
 */
export const onePerPerson = (presences) => {
  const seen = new Set();
  return presences.filter((presence) => {
    const key = presence?.email
      ? `email:${presence.email.toLowerCase()}`
      : `name:${presence?.firstName ?? ''} ${presence?.lastName ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
