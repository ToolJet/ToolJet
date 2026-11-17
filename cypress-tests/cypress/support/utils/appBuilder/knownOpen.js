// QA items from the App Builder panel redesign (ToolJet PR #18471) still open at 4bdaed6682.
// A panel check tagged with an id in this set expects violations, so it fails once it finds none
// and passes again only after the id is deleted here.
export const KNOWN_OPEN = new Set([
  "UC-18",
  "UA-10", "UB-15", "UA-11", "UB-14", "UB-16", "UB-17",
  "UB-19", "UB-21", "UB-20", "UA-19",
  "UB-02", "UB-03", "UA-20", "UC-25", "UA-14",
]);
