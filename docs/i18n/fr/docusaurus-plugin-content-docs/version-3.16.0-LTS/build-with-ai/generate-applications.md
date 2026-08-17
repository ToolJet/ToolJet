---
id: generate-applications
title: Générer des applications
---

Ce guide explique comment générer et modifier rapidement des applications métier à l'aide de ToolJet. Vous pouvez créer une application à partir de zéro avec un seul prompt, ou améliorer une application existante grâce à l'assistance de l'IA.

## Créer une application
Pour créer une application, suivez ces étapes :

1. **Saisir un prompt** – Décrivez l'application métier que vous souhaitez créer dans le champ de saisie du prompt sur le tableau de bord.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/prompt.png" alt="tooljet generate apps" />
2. **Vérifier le fichier de spécifications** – Après avoir soumis votre prompt, une nouvelle application sera créée, et vous serez redirigé vers l'App Builder, où un fichier de spécifications sera généré, incluant la liste des fonctionnalités, la navigation, etc.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/specs.png" alt="tooljet generate apps" />
3. **Concevoir la mise en page** - Une fois que vous acceptez les spécifications, une mise en page (Design Layout) sera générée ; vous pouvez soit l'accepter, soit la modifier dans le builder visuel.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/ui.png" alt="tooljet generate apps" />
4. **Sélectionner la source de données** - Après avoir approuvé la mise en page, vous devez sélectionner la source de données ; ToolJet AI Builder prend actuellement en charge deux sources de données - PostgreSQL et MongoDB.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/ds.png" alt="tooljet generate apps" />
5. **Schéma de la base de données** - Après avoir sélectionné la source de données, vous pouvez approuver ou modifier le schéma de la base de données.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/schema.png" alt="tooljet generate apps" />
6. **Génération de l'application** – Une fois que vous avez confirmé toutes les exigences, une application entièrement fonctionnelle sera générée.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/app.png" alt="tooljet generate apps" />

### Modifier une application

Vous pouvez modifier n'importe quelle application dans ToolJet avec l'assistance de l'IA, qu'il s'agisse d'une application nouvellement créée ou existante. Vous pouvez mettre à jour les composants et les queries au sein de votre application avec un simple prompt.
<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/modify.png" alt="tooljet generate apps" />

## Créer des modules

ToolJet AI peut être utilisé pour générer rapidement des modules, qui peuvent ensuite être réutilisés dans plusieurs applications. Pour générer un module à l'aide de ToolJet AI, ouvrez le Module Builder et saisissez votre prompt décrivant l'interface que vous souhaitez créer.

<img className="screenshot-full img-full" src="/img/tooljet-ai/modules/generate.png" alt="tooljet generate modules" />

### Limitation

Actuellement, les modules générés par l'IA se concentrent uniquement sur la génération de l'interface. Les sources de données, les queries et les configurations d'entrée/sortie ne sont pas incluses dans le flux de génération par l'IA et doivent être configurées manuellement.

## Générer une query {#generate-query}

ToolJet AI peut générer des queries complètes et entièrement configurées directement depuis le chat IA. Il crée une véritable query dans votre panneau des queries — avec les paramètres et la configuration déjà en place.

Pour générer une query :
1. Ajoutez une query dans le panneau des queries.
2. Ouvrez le chat IA dans l'App Builder.
3. Saisissez un prompt décrivant la query dont vous avez besoin en [référençant la query spécifique](/docs/build-with-ai/referencing-app-resources). <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/gen-query.png" alt="tooljet generate modules" />
4. L'IA génère la query avec tous les paramètres et champs requis.

Vous pouvez utiliser [Référencer les ressources de l'application](/docs/build-with-ai/referencing-app-resources) pour référencer une query existante et demander à l'IA de la modifier.

### Limitations

ToolJet AI prend en charge la génération de queries pour les sources de données suivantes :

- [Postgres](/docs/data-sources/postgresql/)
- [MongoDB](/docs/data-sources/mongodb)
- [OpenAPI](/docs/data-sources/openapi)

## Générer du code

ToolJet vous permet de générer des extraits de code JavaScript et Python directement à l'aide de l'IA. Pour générer des queries de base de données complètes connectées à une source de données, consultez [Générer une query](#generate-query) ci-dessus.

1. Cliquez sur l'icône IA dans le panneau des queries pour ouvrir le générateur de code IA. <br/>
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/gen-code/icon.png" alt="tooljet generate apps" />
2. Saisissez un prompt décrivant la logique ou la query que vous souhaitez construire. <br/>
    <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/tooljet-ai/gen-code/prompt.png" alt="tooljet generate apps" />
3. Vérifiez le code généré et insérez-le directement, ou cliquez sur Regenerate pour essayer une version différente. <br/>
    <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/tooljet-ai/gen-code/results.png" alt="tooljet generate apps" />

## Tri automatique des queries {#auto-sort-queries}

À mesure que les applications se développent, les queries peuvent s'accumuler sans organisation claire. La fonctionnalité Auto-sort regroupe automatiquement vos queries dans des dossiers en fonction de leur nom.

Pour utiliser Auto-sort :
1. Ouvrez le panneau des queries.
2. Cliquez sur l'option **Auto-sort unsorted queries into folders**. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/auto-sort.png" alt="tooljet generate modules" />
3. L'IA analyse les noms de vos queries et les organise en dossiers.

**Comment ça fonctionne :**
- Si des dossiers existent déjà dans votre application, les queries sont associées au dossier correspondant le plus proche lorsque cela est pertinent, et de nouveaux dossiers sont créés pour le reste.
- Si aucun dossier n'existe, de nouveaux dossiers sont créés en fonction des regroupements par nom de query.
- Seuls les noms des queries sont envoyés à l'IA - aucun contenu de query ni identifiant de source de données n'est partagé, pour des raisons de conformité.
- Les résultats dépendent de noms de query descriptifs. Des noms génériques comme `postgres_1`, `postgres_2` produiront des regroupements moins précis.
