---
id: marketplace-plugin-hugging_face
title: Hugging Face
---

L'intégration de Hugging Face avec ToolJet vous permet d'utiliser des capacités avancées de traitement du langage naturel. Grâce aux modèles de pointe de Hugging Face, vous pouvez générer du contenu de haute qualité et résumer du texte de manière fluide.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

Ce plugin exploite l'Inference API de Hugging Face pour garantir une intégration fluide avec les modèles pris en charge. Pour vérifier si un modèle est pris en charge, référez-vous à la section Inference API sur sa page **[Hugging Face](https://huggingface.co/models)**.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/huggingface/inference-api.png" alt="Hugging Face Configuration" />


## Connexion

Pour vous connecter à Hugging Face, vous aurez besoin du **Personal access token**, qui peut être généré depuis la **[plateforme Hugging Face](https://huggingface.co/settings/tokens)**.

Vous pouvez utiliser les bascules suivantes :
- **Use Cache** : Utilisez cette option pour activer la couche de cache sur l'inference API afin d'accélérer les temps de réponse pour les requêtes répétées. Elle est activée par défaut.
- **Wait for Model** : Utilisez cette option pour attendre le chargement du modèle s'il n'est pas prêt, afin d'éviter toute erreur. Elle est désactivée par défaut.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/huggingface/connection.png" alt="Hugging Face datasource Configuration" />

## Opérations prises en charge

### Text Generation

Utilisez cette opération pour générer du texte en fonction de l'entrée et des paramètres du modèle. Elle fournit des informations ou des explications adaptées au contexte donné. Découvrez tous les modèles de génération de texte disponibles sur [Hugging Face](https://huggingface.co/models?pipeline_tag=text-generation&sort=trending).

**Paramètres requis**

- **Model** : Spécifie le modèle à utiliser pour générer les réponses.

    Exemples de modèles -
    - [google/gemma-2-2b-it](https://huggingface.co/google/gemma-2-2b-it)
    - [tiiuae/falcon-7b-instruct](https://huggingface.co/tiiuae/falcon-7b-instruct)
    - [HuggingFaceH4/zephyr-7b-beta](https://huggingface.co/HuggingFaceH4/zephyr-7b-beta)
    - [mistralai/Mistral-7B-Instruct-v0.2](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2)

- **Input** : L'entrée utilisateur pour générer les réponses.

**Paramètre optionnel**

- **Operation Parameters** : Paramètres supplémentaires pour configurer la réponse du modèle. Ces paramètres peuvent varier selon le modèle utilisé.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/huggingface/text-gen.png" alt="Gemini Query" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

Intégration de l'IA avec ToolJet :

**Avantages de l'intégration ToolJet :**

* **Développement plus rapide :** Rationalisez le processus de développement grâce à des intégrations et modèles prêts à l'emploi pour les workflows courants.
* **Coûts réduits :** Automatisez les tâches et réduisez le besoin de code personnalisé, économisant ainsi du temps et de l'argent de développement.
* **Productivité accrue :** Permettez à votre équipe de créer et déployer des outils plus rapidement, afin qu'elle puisse se concentrer sur des tâches plus stratégiques.
* **Collaboration améliorée :** Favorisez une collaboration fluide entre développeurs et utilisateurs métier grâce à une plateforme unifiée de création d'outils.

**Intégration de ToolJet avec l'outillage existant :**

* **Intégration avec des outils populaires :** ToolJet peut s'intégrer avec divers outils, notamment Slack, Jira, Google Drive, et plus encore.
* **Personnalisation :** Personnalisez l'intégration pour l'adapter à vos workflows et exigences spécifiques.

**Comment ToolJet s'intègre à l'outillage existant :**

* **API :** Exploitez des API ouvertes pour connecter ToolJet à d'autres outils et services.
* **Intégration Webhook :** Intégrez ToolJet à des services externes via des webhooks pour déclencher des actions en fonction d'événements.
* **Plugins ToolJet :** Explorez une bibliothèque de plugins qui étendent les fonctionnalités de ToolJet et facilitent les intégrations.

**Exemples de cas d'usage :**

* **Pipeline de données automatisé :** Connectez ToolJet à une plateforme d'entreposage de données comme Snowflake pour automatiser l'extraction et la transformation des données.
* **Gestion des workflows :** Intégrez ToolJet à un outil de gestion de projet comme Jira pour créer des workflows automatisés pour les tâches et les approbations.
* **Reporting personnalisable :** Connectez ToolJet à un outil de reporting comme Google Analytics pour générer des rapports personnalisés basés sur l'analyse de données.
* **Notifications automatiques :** Intégrez ToolJet à une plateforme de communication comme Slack pour déclencher des notifications lors de tâches terminées ou de mises à jour système.

**Conclusion :**

Les capacités d'intégration de ToolJet renforcent considérablement la puissance et la flexibilité de vos workflows de développement, vous permettant de créer des outils personnalisés plus rapidement et plus efficacement. En exploitant des intégrations prêtes à l'emploi, la personnalisation et les API, ToolJet permet à votre équipe d'atteindre une productivité accrue et de rationaliser ses processus à toutes les étapes du cycle de développement.

</details>

### Summarisation

Utilisez cette opération pour créer un résumé du texte d'entrée en fonction des paramètres du modèle. Découvrez tous les modèles de résumé disponibles sur [Hugging Face](https://huggingface.co/models?pipeline_tag=summarization&sort=trending).

**Paramètres requis**

- **Model** : Spécifie le modèle à utiliser pour générer le résumé.

    Exemples de modèles -
    - [facebook/bart-large-cnn](https://huggingface.co/facebook/bart-large-cnn)
    - [philschmid/bart-large-cnn-samsum](https://huggingface.co/philschmid/bart-large-cnn-samsum)
    - [google/pegasus-xsum](https://huggingface.co/google/pegasus-xsum)
    - [ainize/bart-base-cnn](https://huggingface.co/ainize/bart-base-cnn)
    - [Falconsai/text_summarization](https://huggingface.co/Falconsai/text_summarization)


- **Input** : Le texte d'entrée à résumer.

**Paramètre optionnel**

- **Operation Parameters** : Paramètres supplémentaires pour configurer la réponse du modèle. Ces paramètres peuvent varier selon le modèle utilisé.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/huggingface/summarization.png" alt="Gemini Query" />

<details id="tj-dropdown">
<summary>**Exemple de réponse**</summary>

ToolJet peut s'intégrer avec divers outils, notamment Slack, Jira, Google Drive, et plus encore. Intégration de l'IA avec ToolJet : ses capacités renforcent considérablement la puissance et la flexibilité de vos workflows de développement. En exploitant des intégrations prêtes à l'emploi, la personnalisation et les API, ToolJet permet à votre équipe d'atteindre une productivité accrue.

</details>
