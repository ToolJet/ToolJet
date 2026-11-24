// The canvas interaction engine (interaction/) imports the selection rule from here, as in PR #18532. The rule
// itself stays in Grid/gridUtils.js, where the Moveable path and the other callers import it from.
export { findHighestLevelofSelection } from './Grid/gridUtils';
