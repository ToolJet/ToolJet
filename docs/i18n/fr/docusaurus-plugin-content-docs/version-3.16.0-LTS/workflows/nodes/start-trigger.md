---
id: start-trigger
title: Nœud Start Trigger
---

<br/>

Le **nœud Start Trigger** est le point d'entrée du workflow. Il détermine comment et quand un workflow est déclenché, et permet de transmettre des données initiales au workflow.

- **Définit le début d'un workflow** : chaque workflow doit commencer par un seul **nœud Start Trigger**. Cela garantit un point d'entrée clair, ce qui facilite la gestion et le débogage des workflows.
- **Transmet des données initiales** : le **nœud Start Trigger** vous permet de transmettre des données au workflow, qui pourront ensuite être utilisées par les nœuds suivants. Par exemple, des valeurs de formulaire, des charges utiles de webhook ou des valeurs par défaut planifiées peuvent alimenter le workflow pour piloter la logique et les actions.
- **Organise l'exécution du workflow** : en tant que nœud de départ, il définit le flux de données et de contrôle, reliant l'événement déclencheur aux nœuds de logique et d'action suivants, de manière structurée et visuelle.

## Paramètres JSON de test

Les **paramètres JSON de test** (Test JSON Parameters) vous permettent de définir des paramètres de test au format JSON pour tester les charges utiles de webhook. Lorsque vous cliquez sur **Run**, le workflow s'exécute en utilisant ces paramètres de test à la place de la charge utile du webhook.

<img className="screenshot-full img-full" src="/img/workflows/nodes/start/testJson.png" alt="Test JSON Param" />

### Accéder aux valeurs des paramètres

Vous pouvez accéder aux paramètres envoyés via la charge utile du webhook ou définis dans les **Test JSON Parameters** grâce à la syntaxe suivante :

```js
startTrigger.params.<parameter-name>
```

Si à la fois la charge utile du webhook et les **Test JSON Parameters** sont présents, la charge utile du webhook a priorité. Si aucune valeur n'est fournie via le webhook, les **Test JSON Parameters** servent de valeurs par défaut.