export enum GitErrorMessages {
  BRANCH_NOT_FOUND = 'Specified branch from env variable is \n missing in Github repository',
  BRANCH_NAME_MISMATCH = 'Could not push commit to the repository. Please ensure your default branch name is master and try again.',
  GENERIC_CLONE_ERROR = 'Issue while cloning',
  REPOSITORY_NOT_FOUND = 'Repository not found. Please verify the repository URL is correct and accessible.',
  INVALID_PRIVATE_KEY = "Invalid GitHub private key format. Please check the key and ensure it's properly formatted.",
  INVALID_APP_ID = 'Invalid GitHub App ID. Please verify the App ID and try again.',
  INVALID_INSTALLATION_ID = 'Invalid Installation ID. Please verify the GitHub installation ID and try again.',
  INVALID_BRANCH_NAME = 'Invalid Branch Name. Please verify the branch exists in the repository and try again.',
  COMMIT_FAILED = 'Failed to commit changes to Git repository. Please try again',
  CLONE_FAILED = 'Failed to clone Git repository. Please try again.',
  PUSH_FAILED = 'Failed to push commits to remote. Please try again',
  GITHUB_ENTERPRISE_INVALID_URL_FORMAT = 'Enterprise URL and API URL mismatch.\n Please verify and try again.',
}
