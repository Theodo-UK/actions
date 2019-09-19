import * as github from "@actions/github";
import * as yaml from "js-yaml";

export async function getConfig<T>(
  client: github.GitHub,
  ref: string,
  path: string
): Promise<T> {
  const response = await client.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path,
    ref
  });

  const configContent = Buffer.from(response.data.content, "base64").toString();
  const configObject: T = yaml.safeLoad(configContent);

  return configObject;
}
