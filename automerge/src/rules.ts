import * as core from "@actions/core";
import * as github from "@actions/github";
import { Rule, RuleConditions, Config } from "./types"; // eslint-disable-line

async function conditionApplies<T extends keyof RuleConditions>(
  type: T,
  value: RuleConditions[T],
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
      console.log(value, response.data);
      return response.data.user.login === value;
    }
    case "base":
      return pullRequest.base.ref === value;
    case "status": {
      const conf = value as RuleConditions["status"];
      const ignoredApps = conf.ignoredChecks || [];
      const response = await client.checks.listSuitesForRef({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref: sha
      });
      let inProgressIgnored = false;
      return response.data.check_suites.every(suite => {
        if (ignoredApps.includes(suite.app["slug"])) {
          core.debug(`Status for ${suite.app.name}: ignored.`);
          return true;
        }
        if (suite.status === "in_progress") {
          if (inProgressIgnored) {
            core.debug(
              `Status for ${suite.app.name}: "in_progress" -> AGAIN! KO`
            );
            return false;
          } else {
            inProgressIgnored = true;
            core.debug(
              `Status for ${suite.app.name}: "in_progress" -> ignoring`
            );
            return true;
          }
        }

        const res =
          suite.status === "completed" && suite.conclusion === conf.value;
        core.debug(`Status for ${suite.app.name}: ${res ? "OK" : "KO"}`);
        return res;
      });
    }
    default:
      return true;
  }
}

async function ruleApplies(
  rule: Rule,
  pullRequest: any,
  client: github.GitHub,
  sha: string
): Promise<boolean> {
  const conditionTypes = Object.keys(
    rule.conditions
  ) as (keyof RuleConditions)[];
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
  console.log(`Rule "${rule.name}" ${result ? "applies" : "doesn't apply"}.`);
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
        console.log(`Merging PR #${pullRequest.number} (rule "${rule.name}").`);
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
