import * as core from "@actions/core";
import * as github from "@actions/github";
import * as circleci from "./circleci";
import { getParameters } from "./diff";

function getPullRequest() {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    core.setFailed("Could not find a PR.");
    throw new Error("could not find PR");
  }

  return pullRequest;
}

async function run() {
  const pullRequest = getPullRequest();
  if (!pullRequest) {
    core.setFailed("Could not find a PR number.");
    throw new Error("could not find PR number");
  }

  const token = core.getInput("circleci_token", { required: true });

  const params = await getParameters(pullRequest.head.ref);
  console.log(`pipeline parameters: ${JSON.stringify(params)}`);

  const { id } = await circleci.createPipeline(
    token,
    github.context.repo.owner,
    github.context.repo.repo,
    pullRequest.head.ref,
    params
  );

  core.setOutput("pipeline_id", id);
}

run();
