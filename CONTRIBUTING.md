# Contributing to ToolJet
We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Setup 

- [Mac OS](https://docs.tooljet.io/docs/contributing-guide/setup/macos)
- [Docker](https://docs.tooljet.io/docs/contributing-guide/setup/docker)
- [Ubuntu](https://docs.tooljet.io/docs/contributing-guide/setup/ubuntu)

## We Develop with GitHub
We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## First-time contributors
We've tagged some issues to make it easy to get started :smile:
[Good first issues](https://github.com/ToolJet/ToolJet/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) 

If you're interested in working on an issue, make sure it has either a `good-first-issue` or `up-for-grabs` label added. Add a comment on the issue and wait for the issue to be assigned before you start working on it. This helps to avoid multiple people working on similar issues.

## We Use [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow), So All Code Changes Happen Through Pull Requests
Pull requests are the best way to propose changes to the codebase (we use [Git-Flow](https://nvie.com/posts/a-successful-git-branching-model/)). We actively welcome your pull requests:

1. Fork the repo and create your branch from `develop`. Please create the branch in the format feature/<issue-id>-<issue-name> (eg: feature/176-chart-widget)
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the AGPL v3 License
In short, when you submit code changes, your submissions are understood to be under the same [AGPL v3 License](https://www.gnu.org/licenses/agpl-3.0.en.html) that covers the project.

## Report bugs using GitHub's [issues](https://github.com/ToolJet/ToolJet/issues)
We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/ToolJet/ToolJet/issues/new/choose). It's that easy!

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## License
By contributing, you agree that your contributions will be licensed under its AGPL v3 License.

## Questions? 
Contact us [on Slack](https://tooljet.com/slack) or [email us at hello@tooljet.io](mailto:hello@tooljet.io).

## Setting Up the Repository

To set up the ToolJet repository locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ToolJet/ToolJet.git
   cd ToolJet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

For more detailed setup instructions, refer to the [Setup Guide](https://docs.tooljet.com/docs/contributing-guide/setup).

## Usage Examples

Here are some examples of how you can use ToolJet to build internal tools:

1. **Time Tracker Application:**
   - Create a new application in ToolJet.
   - Add a table component to display the list of tasks.
   - Use the built-in Timer component to track time spent on each task.
   - Save the tracked time to a database using a query.

2. **CMS (Content Management System):**
   - Create a new application in ToolJet.
   - Add a form component to allow users to create and edit content.
   - Use the built-in Rich Text Editor component for content editing.
   - Save the content to a database using a query.
   - Display the content in a table or list component.

3. **AWS S3 Browser:**
   - Create a new application in ToolJet.
   - Add a file picker component to allow users to upload files to S3.
   - Use the built-in S3 integration to list and manage files in an S3 bucket.
   - Display the list of files in a table component.
   - Add buttons to download or delete files from S3.

For more usage examples and tutorials, refer to the [ToolJet Blog](https://blog.tooljet.com) and the [Documentation](https://docs.tooljet.com).
