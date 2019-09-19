import * as core from "@actions/core";
import * as github from "@actions/github";

export function getPullRequest() {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    core.setFailed("Could not find a PR.");
    throw new Error("could not find PR");
  }

  return pullRequest;
}
