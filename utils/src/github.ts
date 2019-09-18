import * as core from "@actions/core";
import * as github from "@actions/github";

let client: github.GitHub;

export function getClient(token?: string): github.GitHub {
  if (!client) {
    if (!token) {
      token = core.getInput("github_token", { required: true });
    }
    client = new github.GitHub(token);
  }

  return client;
}
