import * as core from "@actions/core";
import * as github from "@actions/github";
import * as yaml from "js-yaml";
import { Minimatch } from "minimatch";

async function getConfig(client: github.GitHub, sha: string): Promise<any> {
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

function getPrNumber(): number {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    core.setFailed("Could not find a PR number.");
    throw new Error("could not find PR number");
  }

  return pullRequest.number;
}

async function getChangedFiles(client: github.GitHub): Promise<string[]> {
  const listFilesResponse = await client.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: getPrNumber()
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
  const githubToken = core.getInput("github_token", { required: true });
  const client = new github.GitHub(githubToken);

  const [config, changedFiles] = await Promise.all([
    getConfig(client, sha),
    getChangedFiles(client)
  ]);

  const parameters = {};
  for (let workflow in config) {
    parameters[workflow] = checkGlobs(changedFiles, config[workflow]);
  }

  return parameters;
}
