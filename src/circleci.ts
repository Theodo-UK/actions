import axios from "axios";

export async function createPipeline(
  token: string,
  org: string,
  repo: string,
  branch: string,
  parameters: object
) {
  const res = await axios.post(
    `https://circleci.com/api/v2/project/gh/${org}/${repo}/pipeline`,
    {
      branch,
      parameters
    },
    {
      auth: {
        username: token,
        password: ""
      }
    }
  );
  return res.data;
}

export async function inspectPipeline(token: string, pipelineId: string) {
  const res = await axios.get(
    `https://circleci.com/api/v2/pipeline/${pipelineId}`,
    {
      auth: {
        username: token,
        password: ""
      }
    }
  );
  return res.data;
}
