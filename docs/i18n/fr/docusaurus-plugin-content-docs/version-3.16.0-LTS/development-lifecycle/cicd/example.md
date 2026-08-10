---
id: example
title: Enable CI/CD with Jenkins
---

<PlanBadge type="enterprise" />

Dans le développement logiciel moderne, les équipes s'appuient souvent sur des outils CI/CD comme **GitHub Actions**, **Jenkins**, **GitLab CI** et **CircleCI** pour automatiser les tests d'application, le contrôle de version et les déploiements. Ces outils aident à renforcer la cohérence entre les instances, réduisent la charge manuelle et améliorent les cycles de livraison en introduisant l'automatisation à chaque étape du processus de livraison logicielle.

Avec les **API CI/CD de git sync de ToolJet**, les organisations peuvent apporter le même niveau d'automatisation et de contrôle à leurs applications internes construites sur ToolJet. En intégrant git sync avec des pipelines CI/CD, vous pouvez :
- **Automatiser les opérations Git** telles que la synchronisation, le push et le pull des modifications d'application.
- **Déployer des applications à travers les environnements** comme le développement, le staging et la production, sans intervention manuelle.

Dans ce guide, nous allons montrer comment intégrer **git sync CI/CD** avec **Jenkins**. La même approche peut également être adaptée à d'autres outils d'automatisation comme GitHub Actions ou GitLab CI, selon les préférences de votre organisation.

Nous utiliserons un scénario d'exemple d'une organisation appelée **Pyratech**, qui gère des applications ToolJet internes sur plusieurs instances.

## Aperçu de la configuration
- **Dépôt Git** : `https://github.com/pyratech/internal-apps.git`
- **Instances** :
  - Instance de développement : `https://dev.pyratech.com`
  - Instance de staging : `https://staging.pyratech.com`
  - Instance de production : `https://prod.pyratech.com`
- **Objectif** :
  - Les développeurs commitent les modifications depuis l'instance de développement vers le dépôt GitHub configuré.
  - Les pipelines Jenkins gèrent la synchronisation, le push, le pull et la promotion des applications entre les instances à l'aide des API CI/CD de git sync de ToolJet.


Voici les principales étapes pour mettre en place l'intégration de Jenkins avec git sync de ToolJet :

## 1. Configurer Git Sync pour chaque instance

Avant de mettre en place Jenkins, vous devez configurer git sync sur chaque instance ToolJet à l'aide de la **HTTPS Git Config API**.

**Exemple d'étape shell Jenkins** (étape de script optionnelle) :
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
Remplacez `$DEV_ACCESS_TOKEN` par le jeton d'accès généré pour l'environnement de développement. Mettez en place de la même manière les configurations git sync pour les instances de staging et de production.


## 2. Configurer les identifiants dans Jenkins :
1. Dans Jenkins, allez dans **Manage Jenkins > Manage Credentials > System**.
2. Cliquez sur **Global credentials (unrestricted)**.
3. Ajoutez de nouveaux identifiants pour chaque instance ToolJet, tels que BASE_URL, TOOLJET_ACCESS_TOKEN et GITHUB_ACCESS_TOKEN.
4. Enregistrez les identifiants.

## 3. Configuration du pipeline Jenkins avec les opérations Git Sync

Pour notre exemple, une approche possible consiste à créer un **[pipeline Jenkins](https://www.jenkins.io/doc/book/pipeline/) unique et réutilisable** capable d'exécuter différentes actions CI/CD de git sync.

Avec cette configuration de pipeline :
- Les développeurs ou les équipes DevOps peuvent sélectionner l'action git sync souhaitée (setup config, push, pull, deploy, etc.) au moment de déclencher le pipeline.
- Les identifiants sensibles, comme les jetons ToolJet et les clés GitHub App, sont stockés de manière sécurisée dans Jenkins à l'aide du **[Credentials Manager](https://www.jenkins.io/doc/book/security/credentials/) de Jenkins**.
- Le pipeline déclenche dynamiquement le endpoint API de git sync de ToolJet approprié selon les paramètres sélectionnés.

## 4. Actions du pipeline Jenkins

Le pipeline Jenkins doit inclure plusieurs étapes correspondant aux différentes actions git sync. Voici un aperçu global de ce à quoi chaque étape pourrait ressembler :

**Actions git sync :**
| Action | Description |
|--------|-------------|
| **SETUP_GIT_CONFIG** | Configure la connexion git sync pour l'organisation avec les identifiants GitHub App. |
| **PUSH_TO_GIT** | Pousse une version spécifique d'une application depuis ToolJet vers GitHub. |
| **CREATE_FROM_GIT** | Crée une nouvelle application ToolJet à partir du dépôt GitHub. |
| **SYNC_FROM_GIT** | Récupère les dernières modifications depuis GitHub dans l'application ToolJet spécifiée. |
| **DEPLOY** | Déploie l'application vers l'environnement cible. |

Chacune de ces actions correspond à un appel REST API spécifique, géré au sein des fonctions du pipeline comme `setupGitConfig()`, `pushToGit()`, `syncFromGit()` et `deployApp()`. Cliquez [ici](/docs/development-lifecycle/cicd/example#3-jenkins-pipeline-setup-with-git-sync-operations) pour voir l'extrait de code complet du Jenkinsfile.

## 5. Exemple de flux du pipeline

Décomposons un exemple utilisant le même pipeline pour plusieurs instances ToolJet :

- **Instance Dev (développement)** :
    - Les développeurs poussent les modifications d'application vers GitHub.
    - Le pipeline Jenkins est déclenché avec :
      - `ACTION = SYNC_FROM_GIT`
      - `APP_ID = dev-app-id`
    - Jenkins récupère les dernières modifications GitHub dans l'instance Dev.

- **Instance Staging** :
    - L'équipe QA déclenche :
      - `ACTION = PUSH_TO_GIT` (optionnel) — pour resynchroniser les modifications Dev vers GitHub.
      - `ACTION = SYNC_FROM_GIT` — pour récupérer les dernières mises à jour GitHub.
      - `ACTION = DEPLOY` — pour promouvoir vers l'environnement de staging.

- **Instance Production** :
    - Le Release Manager déclenche :
      - `ACTION = SYNC_FROM_GIT`
      - `ACTION = DEPLOY` — pour promouvoir les modifications finales vers la production.

Voici la configuration du pipeline Jenkins pour le flux CI/CD de git sync de Pyratech dont nous avons parlé ci-dessus.

<details id="tj-dropdown">
<summary>Cliquez pour développer le Jenkinsfile</summary>
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
