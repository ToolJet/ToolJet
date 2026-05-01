import React from 'react';
import './PlanBadge.css';

const LightningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="currentColor"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="4"
      d="M19 4h18L26 18h15L17 44l5-19H8L19 4Z"
    />
  </svg>
);

const GroupIcon = () => (
  <svg width="14" height="14" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="currentColor"
      d="M17.531 1c-1.798 0-3.367.927-4.062 2.688c1.459 1.204 2.469 3.067 2.469 5.593c0 2.697-1.272 5.162-2.594 6.75c2.106.797 5.402 2.394 6.344 4.844c3.318-.184 6.28-.852 6.28-2.75V17.5c0-1.74-3.034-3.443-5.718-4.344c-.122-.04-.89-.226-.406-1.719c1.26-1.316 2.125-3.446 2.125-5.53C21.969 2.696 19.973 1 17.53 1zM8.97 4.094c-2.6 0-4.844 1.775-4.844 5.187c0 2.23 1.06 4.506 2.406 5.906c.525 1.399-.428 2.395-.625 2.47C3.186 18.653 0 20.452 0 22.25v.688c0 2.449 4.671 3 9 3c4.334 0 8.969-.551 8.969-3v-.688c0-1.852-3.208-3.635-6.063-4.594c-.13-.043-.951-.913-.437-2.5h-.031c1.34-1.4 2.5-3.654 2.5-5.875c0-3.412-2.371-5.187-4.97-5.187z"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 17 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M14.961 3.031h-.992v-.997h-1.016V.031h-.938v2.003h-.957v.997h-1.023v2H9V16h6.982V5.031h-1.021v-2zm-1.992.938h1v1h-1v-1zm-2 .015h1v1h-1v-1zM11 13.956h-1v-1h1v1zm0-1.999h-1v-1h1v1zm0-1.999h-1v-1h1v1zM11 8h-1V7h1v1zm2 5.956h-1v-1h1v1zm0-1.999h-1v-1h1v1zm0-1.999h-1v-1h1v1zM13 8h-1V7h1v1zm2 5.956h-1v-1h1v1zm0-1.999h-1v-1h1v1zm0-1.999h-1v-1h1v1zm0-2.009h-1v-1h1v1zm-8.039-4.9H5.924v-.997h-.949V.047h-.928v2.005H3.014v.997h-.979v1.998H1V16h6.982V5.047H6.961V3.049zm-2.004.912h1v1h-1v-1zM3 3.961h1v1H3v-1zm0 10.032H2v-1h1v1zm0-2.004H2v-1h1v1zm0-2.018H2v-1h1v1zM3 8H2V7h1v1zm2 5.969H4v-1h1v1zm0-1.995H4v-1h1v1zm0-1.993H4v-1h1v1zm0-2.006H4v-1h1v1zm2 5.984H6v-1h1v1zm0-1.998H6v-1h1v1zm0-1.998H6v-1h1v1zm0-2.008H6v-1h1v1z"
    />
  </svg>
);

const ServerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="currentColor"
      d="M15 17a1 1 0 1 0 1 1a1 1 0 0 0-1-1Zm-6 0H6a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2Zm9 0a1 1 0 1 0 1 1a1 1 0 0 0-1-1Zm-3-6a1 1 0 1 0 1 1a1 1 0 0 0-1-1Zm-6 0H6a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2Zm9-6a1 1 0 1 0 1 1a1 1 0 0 0-1-1Zm0 6a1 1 0 1 0 1 1a1 1 0 0 0-1-1Zm4-6a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v2a3 3 0 0 0 .78 2A3 3 0 0 0 2 11v2a3 3 0 0 0 .78 2A3 3 0 0 0 2 17v2a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-2a3 3 0 0 0-.78-2a3 3 0 0 0 .78-2v-2a3 3 0 0 0-.78-2A3 3 0 0 0 22 7Zm-2 14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1Zm0-6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1Zm0-6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1Zm-5-2a1 1 0 1 0 1 1a1 1 0 0 0-1-1ZM9 5H6a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2Z"
    />
  </svg>
);

const PLANS = {
  pro: { label: 'Pro Plan', className: 'plan-badge--pro', Icon: LightningIcon },
  teams: { label: 'Teams Plan', className: 'plan-badge--teams', Icon: GroupIcon },
  enterprise: { label: 'Enterprise Plan', className: 'plan-badge--enterprise', Icon: BuildingIcon },
  'self-hosted': { label: 'Self Hosted', className: 'plan-badge--self-hosted', Icon: ServerIcon },
};

export default function PlanBadge({ type }) {
  const plan = PLANS[type];
  if (!plan) return null;
  const { Icon, label, className } = plan;
  return (
    <span className={`plan-badge ${className}`}>
      <Icon />
      {label}
    </span>
  );
}
