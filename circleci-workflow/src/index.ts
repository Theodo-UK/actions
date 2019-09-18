import * as core from "@actions/core";
import * as github from "@actions/github";
import { getPullRequest } from "utils";
import * as circleci from "./circleci";
import { getParameters } from "./diff";

async function run() {
  const pullRequest = getPullRequest();

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
