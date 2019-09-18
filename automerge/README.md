# Automerge action

An action to automatically merge PRs when some conditions are met.
Useful for automatic dependencies update.

## Setup

- Configure automerge:
  ```yaml
  # .github/automerge.yml
  rules:
  - name: Merge dependabot PRs that pass the tests
    conditions:
      author: dependabot[bot]
      status: success
      base: master
    actions:
      - merge
  ```

- Create a new GitHub action workflow:
  ```yaml
  # .github/workflows/automerge.yml
  name: Automatically merge PRs
  on: [pull_request]

  jobs:
    automerge:
      runs-on: ubuntu-latest
      steps:
        - name: Automatically merge PR
          uses: Theodo-UK/actions/automerge@master
          with:
            github_token: "${{ secrets.GITHUB_TOKEN }}"
  ```
