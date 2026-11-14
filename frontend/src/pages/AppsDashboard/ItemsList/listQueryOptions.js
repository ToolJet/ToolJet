// "Recent activity" (last viewed by the current user) is the PRD default for new users.
export const DEFAULT_SORT = 'activity_desc';

export const SORT_GROUPS = [
  {
    id: 'name',
    label: 'Name',
    options: [
      { value: 'name_asc', label: 'A → Z' },
      { value: 'name_desc', label: 'Z → A' },
    ],
  },
  {
    id: 'modified',
    label: 'Last modified',
    options: [
      { value: 'modified_desc', label: 'Newest first' },
      { value: 'modified_asc', label: 'Oldest first' },
    ],
  },
  {
    id: 'activity',
    label: 'Recent activity',
    options: [
      { value: 'activity_desc', label: 'Latest first' },
      { value: 'activity_asc', label: 'Earliest first' },
    ],
  },
];

// Options within a group are OR-ed; groups are AND-ed.
export const FILTER_GROUPS = [
  {
    id: 'releaseStatus',
    urlParam: 'release_status',
    label: 'Release status',
    options: [
      { value: 'released', label: 'Released' },
      { value: 'unreleased', label: 'Unreleased' },
    ],
  },
  {
    id: 'visibility',
    urlParam: 'visibility',
    label: 'Visibility',
    options: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
    ],
  },
];

export const SORT_VALUES = SORT_GROUPS.flatMap((group) => group.options.map((option) => option.value));
