import { Rule, ValidationArea } from '../types';
import { componentRules } from './component.rules';
import { eventRules } from './event.rules';
import { layoutRules } from './layout.rules';
import { queryRules } from './query.rules';
import { versionSettingsRules } from './version-settings.rules';

const RULES: Partial<Record<ValidationArea, Rule<any>[]>> = {
  components: componentRules,
  layouts: layoutRules,
  events: eventRules,
  queries: queryRules,
  versionSettings: versionSettingsRules,
};

export function rulesFor(area: ValidationArea): Rule<any>[] {
  return RULES[area] ?? [];
}
