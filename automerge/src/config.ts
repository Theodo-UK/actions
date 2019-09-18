import * as core from "@actions/core";
import * as github from "@actions/github";
import * as yaml from "js-yaml";

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

export async function getConfig(
  client: github.GitHub,
  sha: string
): Promise<Config> {
  const configPath = core.getInput("configuration_path", { required: true });

  const response = await client.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: configPath,
    ref: sha
  });

  const configContent = Buffer.from(response.data.content, "base64").toString();
  const configObject: any = yaml.safeLoad(configContent);

  return configObject;
}
