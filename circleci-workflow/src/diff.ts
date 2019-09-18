import * as core from "@actions/core";
import * as github from "@actions/github";
import { getClient, getConfig, getPullRequest } from "utils";
import { Minimatch } from "minimatch";

type Config = Record<string, string[]>;

async function getChangedFiles(client: github.GitHub): Promise<string[]> {
  const listFilesResponse = await client.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: getPullRequest().number
  });

  const changedFiles = listFilesResponse.data.map(f => f.filename);

  core.debug("found changed files:");
  for (const file of changedFiles) {
    core.debug("  " + file);
  }

  return changedFiles;
}

function checkGlobs(changedFiles: string[], globs: string[]): boolean {
  for (const glob of globs) {
    core.debug(` checking pattern ${glob}`);
    const matcher = new Minimatch(glob);
    for (const changedFile of changedFiles) {
      core.debug(` - ${changedFile}`);
      if (matcher.match(changedFile)) {
        core.debug(` ${changedFile} matches`);
        return true;
      }
    }
  }
  return false;
}

export async function getParameters(sha: string): Promise<object> {
  const configPath = core.getInput("configuration_path", { required: true });
  const client = getClient();

  const [config, changedFiles] = await Promise.all([
    getConfig<Config>(client, sha, configPath),
    getChangedFiles(client)
  ]);

  const parameters = {};
  for (let workflow in config) {
    parameters[workflow] = checkGlobs(changedFiles, config[workflow]);
  }

  return parameters;
}
