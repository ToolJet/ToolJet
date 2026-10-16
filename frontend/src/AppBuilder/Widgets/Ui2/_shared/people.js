// People shown as avatars: names (or name lists) to initials, with an optional photo.

/** An avatar group's people: one name, a comma-separated list, or an array of names or { name, src }. */
export const avatarPeople = (names, src) => {
  const people = (
    Array.isArray(names)
      ? names
      : String(names ?? '')
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
  ).flatMap((entry) => {
    if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
      const name = entry.name ?? entry.label ?? entry.title ?? '';
      return [{ name: String(name), src: typeof entry.src === 'string' ? entry.src : entry.image ?? '' }];
    }
    return entry === null || entry === undefined || entry === '' ? [] : [{ name: String(entry), src: '' }];
  });
  // The single-avatar image property applies when there is one person without their own photo.
  if (people.length === 1 && !people[0].src && src) people[0].src = String(src);
  return people;
};
