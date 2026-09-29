import { Rule, ValidationArea } from '../types';
import { componentRules } from './component.rules';

const RULES: Partial<Record<ValidationArea, Rule<any>[]>> = {
  components: componentRules,
};

export function rulesFor(area: ValidationArea): Rule<any>[] {
  return RULES[area] ?? [];
}
