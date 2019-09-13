# circleci-action

An action to start a CircleCI workflows based on files changed.
Useful for monorepos with several codebases.

## Setup

- Add pipeline parameters to your CircleCi config:
  ```yaml
  # .circleci/config.yml
  parameters:
    run_backend:
      type: boolean
      default: false
    run_frontend:
      type: boolean
      default: false
  ```
- Only run your CircleCI workflows when these parameters are set:
  ```yaml
  # .circleci/config.yml
  workflows:
    version: 2

    backend:
      when: << pipeline.parameters.run_backend >>
      jobs:
        - ...

    frontend:
      when: << pipeline.parameters.run_frontend >>
      jobs:
        - ...
  ```
- Configure the mapping between repo files and CircleCI parameters:
  ```yaml
  # .github/circle_workflows.yml
  run_backend:
    - backend/**/*
  run_frontend:
    - frontend/**/*
  ```
- Create a new GitHub action workflow:
  ```yaml
  # .github/workflows/circleci.yml
  name: Run CircleCI workflows
  on: [pull_request]

  jobs:
    circleci:
      runs-on: ubuntu-latest
      steps:
        - name: Start CircleCI workflows
          uses: Theodo-UK/circleci-action@master
          with:
            circleci_token: "${{ secrets.CIRCLECI_TOKEN }}"
            github_token: "${{ secrets.GITHUB_TOKEN }}"
  ```
- Set the `CIRCLECI_TOKEN` secret in your repo settings (Settings > Secrets > Add a new secret)
