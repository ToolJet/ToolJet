import { Issue, Rule, RuleContext, ValidationResult } from './types';

export type RuleCrashHandler = (ruleId: string, error: Error) => void;

export const isBlocking = (issue: Pick<Issue, 'severity' | 'confidence'>): boolean =>
  issue.confidence === 'certain' && (issue.severity === 'critical' || issue.severity === 'high');

// A rule that throws contributes nothing: a validator bug must never block a save.
export async function runRules<T>(
  rules: Rule<T>[],
  inputs: T[],
  ctx: RuleContext,
  onCrash: RuleCrashHandler = () => undefined
): Promise<ValidationResult> {
  const issues: Issue[] = [];
  for (const rule of rules) {
    for (const input of inputs) {
      try {
        issues.push(...((await rule.check(input, ctx)) ?? []));
      } catch (error) {
        onCrash(rule.id, error as Error);
      }
    }
  }
  return {
    errors: issues.filter(isBlocking),
    warnings: issues.filter((issue) => !isBlocking(issue)),
  };
}
