---
id: example
title: Enable CI/CD with Jenkins
---

<div className="badge badge--primary heading-badge">   
  <img 
    src="/img/badge-icons/premium.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Paid feature</span>
</div>

In modern software development, teams often rely on CI/CD tools like **GitHub Actions**, **Jenkins**, **GitLab CI**, and **CircleCI** to automate application testing, version control, and deployments. These tools help enforce consistency across instances, reduce manual overhead, and improve release cycles by introducing automation at every stage of the software delivery process.

With **ToolJet’s git sync CI/CD APIs**, organizations can bring the same level of automation and control to their internal applications built on ToolJet. By integrating git sync with CI/CD pipelines, you can:
- **Automate Git operations** such as syncing, pushing, and pulling app changes.
- **Deploy apps across environments** like development, staging, and production without manual intervention.

In this guide, we will demonstrate how to integrate **git sync CI/CD** with **Jenkins**. The same approach can also be adapted to other automation tools like GitHub Actions or GitLab CI depending on your organization's preferences.

We'll use a sample scenario of an organization called **Pyratech**, which manages internal ToolJet applications across multiple instances.

## Setup Overview
- **Git Repository**: `https://github.com/pyratech/internal-apps.git`
- **Instances**:
  - Development Instance: `https://dev.pyratech.com`
  - Staging Instance: `https://staging.pyratech.com`
  - Production Instance: `https://prod.pyratech.com`
- **Goal**:
  - Developers commit changes from development instance to the configured GitHub repository.
  - Jenkins pipelines handle syncing, pushing, pulling, and promoting apps across instances using ToolJet git sync CI/CD APIs.


Here are the key steps involved in setting up Jenkins integration with ToolJet git sync:

## 1. Configure Git Sync for Each Instance

Before setting up Jenkins, you need to configure git sync on each ToolJet instance using the **HTTPS Git Config API**.

**Jenkins Example Shell Step** (optional script stage):
```bash
curl -X POST https://dev.pyratech.com/api/ext/organization/git \
  -H "Authorization: Basic $DEV_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-uuid",
    "gitUrl": "https://github.com/pyratech/internal-apps.git",
    "branchName": "main",
    "githubAppId": "YOUR_APP_ID",
    "githubAppInstallationId": "YOUR_INSTALLATION_ID",
    "githubAppPrivateKey": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
  }'
```
Replace `$DEV_ACCESS_TOKEN` with the access token generated for the development environment. Similarly, set up git sync configurations for staging and production instances.


## 2. Setup Credentials in Jenkins:
1. In Jenkins, navigate to **Manage Jenkins > Manage Credentials > System**.
2. Click **Global credentials (unrestricted)**.
3. Add new credentials for each ToolJet instance such as BASE_URL, TOOLJET_ACCESS_TOKEN and GITHUB_ACCESS_TOKEN
4. Save the credentials.

## 3. Jenkins Pipeline Setup with Git Sync Operations

For our example, one of the approach would be to create a **single reusable [Jenkins pipeline](https://www.jenkins.io/doc/book/pipeline/)** that can execute different git sync CI/CD actions.

With this pipeline setup:
- Developers or DevOps teams can select the desired git sync action (setup config, push, pull, deploy, etc.) when triggering the pipeline.
- Sensitive credentials like ToolJet tokens and GitHub App keys are securely stored in Jenkins using **Jenkins [Credentials Manager](https://www.jenkins.io/doc/book/security/credentials/)**.
- The pipeline dynamically triggers the appropriate ToolJet git sync API endpoint based on selected parameters.

## 4. Jenkins Pipeline Actions

The Jenkins pipeline should include several stages corresponding to various git sync actions. Here’s a high-level overview of what each stage might look like:

**git sync Actions:**
| Action | Description |
|--------|-------------|
| **SETUP_GIT_CONFIG** | Configures the git sync connection for the organization with GitHub App credentials. |
| **PUSH_TO_GIT** | Pushes a specific app version from ToolJet to GitHub. |
| **CREATE_FROM_GIT** | Creates a new ToolJet application from the GitHub repository. |
| **SYNC_FROM_GIT** | Pulls the latest changes from GitHub into the specified ToolJet app. |
| **DEPLOY** | Deploys the app to the target environment. |

Each of these actions maps to a specific REST API call handled within the pipeline functions like `setupGitConfig()`, `pushToGit()`, `syncFromGit()`, and `deployApp()`. Click [here](/docs/development-lifecycle/CI/CD/example#jenkins-pipeline-for-tooljet-git-sync) to see the full Jenkins file code snippet.

## 5. Pipeline Example Flow 

Let’s break down an example using the same pipeline for multiple ToolJet instances:

- **Dev Instance (Development)**:
    - Developers push app changes to GitHub.
    - Jenkins pipeline is triggered with:
      - `ACTION = SYNC_FROM_GIT`
      - `APP_ID = dev-app-id`
    - Jenkins pulls latest GitHub changes into Dev instance.

- **Staging Instance**:
    - QA team triggers:
      - `ACTION = PUSH_TO_GIT` (optional) — to sync Dev changes back to GitHub.
      - `ACTION = SYNC_FROM_GIT` — to pull latest GitHub updates.
      - `ACTION = DEPLOY` — to promote to staging environment.

- **Production Instance**:
    - Release Manager triggers:
      - `ACTION = SYNC_FROM_GIT`
      - `ACTION = DEPLOY` — to promote final changes to production.

Following is the Jenkins pipeline configuration for Pyratech's git sync CI/CD flow we discussed above.

<details id="tj-dropdown">
<summary>Click to expand Jenkinsfile</summary>
```
pipeline {
    agent any

    environment {
        TOOLJET_BASE_URL = credentials('TOOLJET_BASE_URL') // Example: https://dev.pyratech.com
        TOOLJET_ACCESS_TOKEN = credentials('TOOLJET_ACCESS_TOKEN')
    }

    parameters {
        choice(
            name: 'ACTION',
            choices: [
                'SETUP_GIT_CONFIG',
                'PUSH_TO_GIT',
                'CREATE_FROM_GIT',
                'SYNC_FROM_GIT',
                'DEPLOY'
            ],
            description: 'Select the Git sync action to perform'
        )

        string(name: 'APP_ID', defaultValue: '', description: 'App ID (required for PUSH_TO_GIT, SYNC_FROM_GIT, DEPLOY)')
        string(name: 'VERSION_ID', defaultValue: '', description: 'Version ID (required for PUSH_TO_GIT)')
        string(name: 'COMMIT_MESSAGE', defaultValue: 'Automated commit from Jenkins', description: 'Commit message for PUSH_TO_GIT')
        string(name: 'ORG_ID', defaultValue: '', description: 'Organization ID (required for SETUP_GIT_CONFIG, CREATE_FROM_GIT)')
        string(name: 'GIT_URL', defaultValue: '', description: 'Git HTTPS URL (required for SETUP_GIT_CONFIG)')
        string(name: 'BRANCH_NAME', defaultValue: 'main', description: 'Git branch name (required for SETUP_GIT_CONFIG)')
        string(name: 'GITHUB_APP_ID', defaultValue: '', description: 'GitHub App ID (required for SETUP_GIT_CONFIG)')
        string(name: 'GITHUB_APP_INSTALLATION_ID', defaultValue: '', description: 'GitHub App Installation ID (required for SETUP_GIT_CONFIG)')
        text(name: 'GITHUB_APP_PRIVATE_KEY', defaultValue: '', description: 'GitHub App Private Key PEM (required for SETUP_GIT_CONFIG)')
    }

    stages {
        stage('Perform git sync Action') {
            steps {
                script {
                    switch (params.ACTION) {
                        case 'SETUP_GIT_CONFIG':
                            validate(params.ORG_ID, 'ORG_ID')
                            validate(params.GIT_URL, 'GIT_URL')
                            validate(params.BRANCH_NAME, 'BRANCH_NAME')
                            validate(params.GITHUB_APP_ID, 'GITHUB_APP_ID')
                            validate(params.GITHUB_APP_INSTALLATION_ID, 'GITHUB_APP_INSTALLATION_ID')
                            validate(params.GITHUB_APP_PRIVATE_KEY, 'GITHUB_APP_PRIVATE_KEY')
                            setupGitConfig()
                            break
                        case 'PUSH_TO_GIT':
                            validate(params.APP_ID, 'APP_ID')
                            validate(params.VERSION_ID, 'VERSION_ID')
                            pushToGit(params.APP_ID, params.VERSION_ID, params.COMMIT_MESSAGE)
                            break
                        case 'CREATE_FROM_GIT':
                            validate(params.APP_ID, 'APP_ID')
                            validate(params.ORG_ID, 'ORG_ID')
                            createFromGit(params.APP_ID, params.ORG_ID)
                            break
                        case 'SYNC_FROM_GIT':
                            validate(params.APP_ID, 'APP_ID')
                            syncFromGit(params.APP_ID)
                            break
                        case 'DEPLOY':
                            validate(params.APP_ID, 'APP_ID')
                            deployApp(params.APP_ID)
                            break
                        default:
                            error "Invalid ACTION selected: ${params.ACTION}"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ git sync action '${params.ACTION}' completed successfully."
        }
        failure {
            echo "❌ git sync action '${params.ACTION}' failed. Please check logs."
        }
    }
}

def validate(value, name) {
    if (!value?.trim()) {
        error "Missing required parameter: ${name}"
    }
}

def setupGitConfig() {
    def privateKeyFormatted = params.GITHUB_APP_PRIVATE_KEY.replace('\\n', '\n')
    def payload = [
        organizationId: params.ORG_ID,
        gitUrl: params.GIT_URL,
        branchName: params.BRANCH_NAME,
        githubAppId: params.GITHUB_APP_ID,
        githubAppInstallationId: params.GITHUB_APP_INSTALLATION_ID,
        githubAppPrivateKey: privateKeyFormatted
    ]
    def response = httpRequest(
        httpMode: 'POST',
        url: "${env.TOOLJET_BASE_URL}/api/ext/organization/git",
        contentType: 'APPLICATION_JSON',
        customHeaders: [[name: 'Authorization', value: "Basic ${env.TOOLJET_ACCESS_TOKEN}"]],
        requestBody: groovy.json.JsonOutput.toJson(payload)
    )
    if (response.status != 201) {
        error "Failed to set up Git config. Status: ${response.status}. Response: ${response.content}"
    }
}

def pushToGit(appId, versionId, commitMsg) {
    def payload = [commitMessage: commitMsg]
    def response = httpRequest(
        httpMode: 'POST',
        url: "${env.TOOLJET_BASE_URL}/api/ext/apps/${appId}/versions/${versionId}/git-sync/push",
        contentType: 'APPLICATION_JSON',
        customHeaders: [[name: 'Authorization', value: "Basic ${env.TOOLJET_ACCESS_TOKEN}"]],
        requestBody: groovy.json.JsonOutput.toJson(payload)
    )
    if (response.status != 200) {
        error "Failed to push to Git. Status: ${response.status}. Response: ${response.content}"
    }
}

def createFromGit(appId, orgId) {
    def payload = [
        gitAppId: appId,
        gitVersionId: params.BRANCH_NAME,
        organizationId: orgId
    ]
    def response = httpRequest(
        httpMode: 'POST',
        url: "${env.TOOLJET_BASE_URL}/api/ext/apps?createMode=git",
        contentType: 'APPLICATION_JSON',
        customHeaders: [[name: 'Authorization', value: "Basic ${env.TOOLJET_ACCESS_TOKEN}"]],
        requestBody: groovy.json.JsonOutput.toJson(payload)
    )
    if (response.status != 201) {
        error "Failed to create app from Git. Status: ${response.status}. Response: ${response.content}"
    }
}

def syncFromGit(appId) {
    def response = httpRequest(
        httpMode: 'PUT',
        url: "${env.TOOLJET_BASE_URL}/api/ext/apps/${appId}?createMode=git",
        contentType: 'APPLICATION_JSON',
        customHeaders: [[name: 'Authorization', value: "Basic ${env.TOOLJET_ACCESS_TOKEN}"]]
    )
    if (response.status != 200) {
        error "Failed to sync from Git. Status: ${response.status}. Response: ${response.content}"
    }
}

def deployApp(appId) {
    def response = httpRequest(
        httpMode: 'POST',
        url: "${env.TOOLJET_BASE_URL}/api/ext/apps/${appId}/promote",
        contentType: 'APPLICATION_JSON',
        customHeaders: [[name: 'Authorization', value: "Basic ${env.TOOLJET_ACCESS_TOKEN}"]]
    )
    if (response.status != 200) {
        error "Failed to deploy app. Status: ${response.status}. Response: ${response.content}"
    }
}
```
</details>
