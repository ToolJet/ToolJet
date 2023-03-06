export const generateQueryName = (kind, existingQueries) => {
  const queriesOfTheSameKind = existingQueries.filter((query) => query.kind === kind);

  let index = queriesOfTheSameKind.length + 1;
  while (existingQueries.map((query) => query.name).includes(`${kind}${index}`)) {
    index++;
  }

  return `${kind}${index}`;
};
