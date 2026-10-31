// `components.<uuid>.value` → `components.textInput1.value`, given id → name maps. Pure, so the
// code-search worker can run it without the store.

// The trailing path (".value", "?.value", "[0].name", ...) is matched with an include-list
// of what a JS member-path can actually contain, instead of an exclude-list of characters
// that "shouldn't" appear there — an exclude-list has to anticipate every operator that
// might sit next to a reference (this is what missed `<`/`>` previously); an include-list
// of valid identifier/index characters can't miss anything because it's a closed set.
const REFERENCE =
  /(components|queries)(\??\.|\??\.?\[['"]?)([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(['"]?\])?((?:\??\.[A-Za-z_$][\w$]*|\[\d+\]|\['[^']*'\]|\["[^"]*"\])*)/g;

export type IdNameMappings = Partial<Record<'components' | 'queries', Record<string, string | undefined>>>;

export const replaceIdsWithName = (input: string, mappings: IdNameMappings): string =>
  input.replace(
    REFERENCE,
    (match, category: 'components' | 'queries', prefix: string, id: string, closingBracket, path: string) => {
      if (mappings[category] && mappings[category][id]) {
        const name = mappings[category][id];

        // Reconstruct the string with the name instead of UUID
        let result = `${category}`;

        // Handle optional chaining at the beginning
        if (prefix.includes('?.')) {
          result += '?.';
        } else if (prefix.includes('.')) {
          result += '.';
        }

        // Handle bracket notation
        if (prefix.includes('[')) {
          result += `["${name}"]`;
        } else {
          result += name;
        }

        // Append the rest of the member path as-is (already validated by the regex above)
        result += path;

        return result;
      }
      return match; // Return the original match if no mapping is found
    }
  );
