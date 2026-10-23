// Rewrites Bootstrap's `legend+*` as `:where(fieldset)>legend+*`, as src/_styles/tabler.scss writes its own copy (see
// the comment there): the same elements at the same specificity, without making every insertion of an element before
// others restyle all the elements after it.
module.exports = function legendSelectorLoader(source) {
  return source.replace(/(^|[{};,\s])legend\s*\+\s*\*(?=\s*[{,])/g, '$1:where(fieldset)>legend+*');
};
