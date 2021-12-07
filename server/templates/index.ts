import * as GithubContributorsDefinition from "./github-contributors/app-definition.json";
import * as GithubContributorsManifest from "./github-contributors/app-manifest.json";

import * as CustomerDashboardDefinition from "./customer-dashboard/app-definition.json";
import * as CustomerDashboardManifest from "./customer-dashboard/app-manifest.json";

export const TemplateAppDefinitions = {
  [GithubContributorsManifest.id]: GithubContributorsDefinition,
  [CustomerDashboardManifest.id]: CustomerDashboardDefinition,
};

export const TemplateAppManifests = [
  GithubContributorsManifest,
  CustomerDashboardManifest,
];
