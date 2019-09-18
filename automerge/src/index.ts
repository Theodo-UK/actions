import * as core from "@actions/core";
import * as github from "@actions/github";
import { getConfig } from "./config";
import { applyRules } from "./rules";

async function run() {
  const checkRun = github.context.payload.check_run;

  if (!checkRun) {
    core.setFailed("Could not find a check run.");
    process.exit(1);
  }
  if (checkRun.status !== "completed") {
    core.warning("Check is still running");
    process.exit();
  }
  if (checkRun.conclusion !== "success") {
    core.warning("Check failed");
    process.exit();
  }
  if (checkRun.pull_requests.length === 0) {
    core.warning("No pull request to merge");
    process.exit();
  }
  if (checkRun.pull_requests.length > 1) {
    core.setFailed(`Found ${checkRun.pull_requests.length} pull requests.`);
    process.exit(1);
  }
  const pullRequest = checkRun.pull_requests[0];
  const githubToken = core.getInput("github_token", { required: true });
  const client = new github.GitHub(githubToken);

  const config = await getConfig(client, pullRequest.head.sha);
  await applyRules(config, pullRequest, client, checkRun.head_sha);
}

run();
