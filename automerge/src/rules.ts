import * as core from "@actions/core";
import * as github from "@actions/github";
import { ConditionType, Rule, Config } from "./types"; // eslint-disable-line

async function conditionApplies(
  type: ConditionType,
  value: string,
  pullRequest: any,
  client: github.GitHub,
  sha: string
): Promise<boolean> {
  switch (type) {
    case "author": {
      const response = await client.pulls.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pullRequest.number
      });
      return response.data.user.login === value;
    }
    case "base":
      return pullRequest.base.ref === value;
    case "status": {
      const response = await client.repos.getCombinedStatusForRef({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref: sha
      });
      return response.data.state === value;
    }
  }
}

async function ruleApplies(
  rule: Rule,
  pullRequest: any,
  client: github.GitHub,
  sha: string
): Promise<boolean> {
  const conditionTypes = Object.keys(rule.conditions) as ConditionType[];
  const results = await Promise.all(
    conditionTypes.map(conditionType =>
      conditionApplies(
        conditionType,
        rule.conditions[conditionType],
        pullRequest,
        client,
        sha
      ).then(res => {
        core.debug(`Condition "${conditionType}" ${res ? "passes" : "fails"}.`);
        return res;
      })
    )
  );
  const result = results.every(x => !!x);
  core.debug(`Rule "${rule.name}" ${result ? "applies" : "doesn't apply"}.`);
  return result;
}

async function applyRule(rule: Rule, pullRequest: any, client: github.GitHub) {
  for (let action of rule.actions) {
    switch (action) {
      case "merge":
        await client.pulls.merge({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: pullRequest.number
        });
        core.debug(`Merging PR #${pullRequest.number} (rule "${rule.name}").`);
        break;
    }
  }
}

export async function applyRules(
  config: Config,
  pullRequest: any,
  client: github.GitHub,
  sha: string
) {
  await Promise.all(
    config.rules.map((rule: Rule) =>
      ruleApplies(rule, pullRequest, client, sha).then(ok => {
        if (ok) return applyRule(rule, pullRequest, client);
      })
    )
  );
}
