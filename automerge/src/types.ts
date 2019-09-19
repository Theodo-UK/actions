export type ConditionType = "author" | "status" | "base";
export type ActionType = "merge";

export interface Rule {
  name: string;
  conditions: Record<ConditionType, string>;
  actions: ActionType[];
}

export interface Config {
  rules: Rule[];
}
