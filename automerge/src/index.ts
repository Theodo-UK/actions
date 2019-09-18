import * as core from "@actions/core";
import * as github from "@actions/github";
import { getClient, getConfig } from "utils";
import { applyRules } from "./rules";
import { Config } from "./types";

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
  const client = getClient();

  const configPath = core.getInput("configuration_path", { required: true });
  const config = await getConfig<Config>(
    client,
    pullRequest.head.sha,
    configPath
  );
  await applyRules(config, pullRequest, client, checkRun.head_sha);
}

run();
