import * as core from "@actions/core";
import * as github from "@actions/github";
import { getClient, getConfig } from "utils";
import { applyRules } from "./rules";
import { Config } from "./types"; // eslint-disable-line

async function run() {
  const checkSuite = github.context.payload.check_suite;

  console.log(process.env);
  console.log(process.env.GITHUB_WORKFLOW);
  console.log(process.env.GITHUB_ACTION);
  console.log(process.env.GITHUB_EVENT_NAME);

  if (!checkSuite) {
    core.setFailed("Could not find a check run.");
    process.exit(1);
  }
  if (checkSuite.status !== "completed") {
    core.warning("Check is still running");
    process.exit();
  }
  if (checkSuite.conclusion !== "success") {
    core.warning("Check failed");
    process.exit();
  }
  if (checkSuite.pull_requests.length === 0) {
    core.warning("No pull request to merge");
    process.exit();
  }
  if (checkSuite.pull_requests.length > 1) {
    core.setFailed(`Found ${checkSuite.pull_requests.length} pull requests.`);
    process.exit(1);
  }
  const pullRequest = checkSuite.pull_requests[0];
  const client = getClient();

  const configPath = core.getInput("configuration_path", { required: true });
  const config = await getConfig<Config>(
    client,
    pullRequest.head.sha,
    configPath
  );
  await applyRules(config, pullRequest, client, pullRequest.head.sha);
}

run();
