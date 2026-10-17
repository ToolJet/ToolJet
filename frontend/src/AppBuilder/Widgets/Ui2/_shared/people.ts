// People shown as avatars: names (or name lists) to initials, with an optional photo.

/** One avatar: the name its initials come from, and its photo ('' for none). */
export interface AvatarPerson {
  name: string;
  src: string;
}

/** An avatar group's people: one name, a comma-separated list, or an array of names or { name, src }. */
export const avatarPeople = (names: unknown, src?: unknown): AvatarPerson[] => {
  const people = (
    Array.isArray(names)
      ? (names as unknown[])
      : String(names ?? '')
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
  ).flatMap((entry): AvatarPerson[] => {
    if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
      const person = entry as Record<string, unknown>;
      const name = person.name ?? person.label ?? person.title ?? '';
      // `image` is the bound value as given (a URL string in any working app).
      return [
        { name: String(name), src: typeof person.src === 'string' ? person.src : ((person.image ?? '') as string) },
      ];
    }
    return entry === null || entry === undefined || entry === '' ? [] : [{ name: String(entry), src: '' }];
  });
  // The single-avatar image property applies when there is one person without their own photo.
  if (people.length === 1 && !people[0].src && src) people[0].src = String(src);
  return people;
};
