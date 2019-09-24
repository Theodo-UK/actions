export type ActionType = "merge";

export interface RuleConditions {
  author: string;
  base: string;
  status: {
    value: string;
    ignoredChecks?: string[];
  };
}

export interface Rule {
  name: string;
  conditions: RuleConditions;
  actions: ActionType[];
}

export interface Config {
  rules: Rule[];
}
