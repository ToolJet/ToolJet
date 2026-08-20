---
id: integrating-data
title: Intégrer des données
---

ToolJet AI peut lire et comprendre le schéma de votre base de données existante pour construire des applications avec des queries et des liaisons de données déjà configurées. Les outils internes sont souvent construits pour résoudre le problème des données dispersées, des informations réparties sur plusieurs bases de données, API et services. En connectant vos sources de données réelles, vous pouvez vous appuyer sur vos données existantes et créer des applications prêtes pour la production avec l'IA, plutôt que de simples prototypes avec des données fictives.

## Comment ça fonctionne

Lorsque vous fournissez un prompt, ToolJet AI vous demande si vous souhaitez utiliser vos données existantes ou procéder avec des données d'exemple. Si vous choisissez les données existantes, il vous demandera de sélectionner votre source de données, puis l'IA sera en mesure de lire vos tables de base de données ou vos points de terminaison API pour identifier les entités pertinentes pour votre application. Elle présente ensuite un **mapping d'entités** pour votre approbation avant de générer l'application finale.

Un flux typique se présente ainsi :

**Prompt → Document de spécifications → Sélection de la source de données → Mapping d'entités → Génération de l'application**

La séquence exacte peut varier selon le type de prompt que vous fournissez ou la façon dont vous progressez à chaque étape.

:::note Confidentialité des données
1. ToolJet AI n'accède pas à vos données, il utilise uniquement le schéma des tables pour générer les applications.
2. ToolJet AI ne peut pas supprimer de tables ou de données, même si ces tables ont été initialement générées par l'IA elle-même.
:::

## Construire avec des données existantes

### Démarrer avec des données existantes

1. **Saisir un prompt** : décrivez l'application que vous souhaitez construire dans le champ de saisie du prompt sur le tableau de bord.
2. **Choisir vos données** : l'IA vous demandera si vous disposez d'une source de données existante ou si vous souhaitez procéder avec des données d'exemple. Sélectionnez **existing data**.
3. **Consulter le document de spécifications** : l'IA génère un document de spécifications décrivant les fonctionnalités, la navigation et les exigences. Consultez-le et approuvez-le.
4. **Sélectionner la source de données** : choisissez la source de données nécessaire pour votre application. Vous ne pouvez sélectionner qu'une seule source de données. <br/>
    <img style={{marginTop:'15px'}} className="screenshot-full img-s"  src="/img/tooljet-ai/integrate-data/choose-ds.png" alt="Choose Your DS" />
5. **Consulter le mapping d'entités** : l'IA lit vos tables de base de données et vos points de terminaison API, puis présente un mapping des entités vers les tables pertinentes. Consultez-le et approuvez le mapping. <br/>
    <img style={{marginTop:'15px'}} className="screenshot-full img-s"  src="/img/tooljet-ai/integrate-data/entity-mapping.png" alt="Entity Mapping" />
6. **Génération de l'application** : l'IA génère l'application finale avec toutes les queries et liaisons de données configurées sur vos données réelles.

### Démarrer avec des données d'exemple et connecter ses données plus tard

Si vous démarrez avec des données d'exemple, vous pouvez connecter vos sources de données existantes à tout moment :

1. **Générer avec des données d'exemple** : construisez d'abord votre application en utilisant des données d'exemple.
2. **Prompt pour connecter les données** : saisissez un prompt dans le chat IA demandant de connecter votre application à des données réelles.
3. **Sélectionner la source de données** : choisissez la source de données que vous souhaitez connecter.
4. **Consulter le mapping d'entités** : l'IA associe les entités de votre application aux tables pertinentes. S'il manque des informations, l'IA demandera si elle doit mettre à jour le schéma ou créer de nouvelles tables si nécessaire.
5. **Approuver et régénérer** : une fois que vous avez approuvé le mapping, l'IA régénère l'application avec des liaisons de données réelles.

## Mapping d'entités

Le mapping d'entités est l'étape où l'IA vous montre quelles tables de base de données ou sources de données API elle utilisera pour chaque entité de votre application.

- **Pour les bases de données** — le mapping affiche les noms de table spécifiques qui seront utilisés pour chaque entité.
- **Pour les API (OpenAPI)** — le mapping affiche le nom de la source de données.

Une entité peut utiliser plusieurs tables. Par exemple, une entité *Orders* pourrait s'appuyer à la fois sur une table `orders` et une table `order_items`.

Vous pouvez modifier le mapping d'entités avant de l'approuver :

- Consultez la liste complète des tables disponibles dans votre base de données.
- Recherchez une table spécifique par nom.
- Ajoutez ou retirez des tables pour n'importe quelle entité.

## Limitations

- Le support des bases de données est actuellement limité à **PostgreSQL** et **MongoDB**.
- Le support des API est limité aux spécifications **OpenAPI**.
- Vous ne pouvez vous connecter qu'à une seule source de données à la fois.

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un email à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
