---
id: ai-best-practices
title: Bonnes pratiques de l'IA
---

Tirer le meilleur parti de ToolJet AI repose sur deux habitudes : rédiger des prompts qui donnent à l'IA suffisamment de contexte pour travailler, et gérer la longueur de votre conversation afin que l'IA reste performante tout au long de votre session. Ce guide couvre les deux aspects.

## Comprendre la fenêtre de contexte

Chaque conversation avec l'IA dans ToolJet dispose d'une **fenêtre de contexte** — la quantité totale d'informations que l'IA peut activement conserver en mémoire pour une seule session de chat. Cela inclut tout ce que vous avez saisi et tout ce que l'IA a répondu au cours de cette session.

ToolJet AI affiche un petit indicateur dans l'interface de chat qui vous indique la part du contexte de la session actuelle qui a été utilisée. La limite par chat est de **200 000 tokens**.

<img className="screenshot-full img-s"  src="/img/tooljet-ai/best-practice/context.png" alt="tooljet ai doc assistant" />

### Qu'est-ce qu'un token ?

Un token est l'unité que ToolJet AI utilise pour mesurer la taille d'une conversation. En gros, un token représente environ quatre caractères de texte. Vos messages (entrée) et les réponses de l'IA (sortie) consomment tous deux des tokens.

Les tokens ne sont **pas la même chose que les crédits**. Les crédits sont une unité de facturation qui mesure le coût de traitement de l'IA. Les tokens mesurent la quantité de conversation que l'IA peut actuellement conserver en mémoire. Une conversation plus longue utilise plus de tokens, mais la consommation de crédits est basée sur la complexité de chaque opération, et non directement sur le nombre de tokens.

### Pourquoi la fenêtre de contexte est importante

À mesure qu'une conversation s'allonge, l'IA porte davantage d'historique à chaque nouveau message. Lorsque la fenêtre de contexte approche de sa limite, l'IA dispose de moins de marge pour raisonner efficacement. Autour de la barre des **70 %**, vous pouvez commencer à remarquer que l'IA saute des étapes, donne des réponses moins précises, ou perd le fil de détails mentionnés plus tôt dans la conversation.

Ce n'est pas un bug — c'est une limitation naturelle du fonctionnement des modèles d'IA. La solution est simple : démarrez un nouveau chat.

### Quand démarrer un nouveau chat

Démarrez un nouveau chat lorsque l'indicateur d'utilisation du contexte approche 70 %. Commencer une nouvelle session donne à l'IA une ardoise vierge et restaure ses pleines performances.

Voici d'autres situations où un nouveau chat est utile :

- Vous avez terminé une tâche et passez à quelque chose de différent.
- Les réponses de l'IA deviennent répétitives ou moins précises.
- Votre conversation a traversé de nombreux allers-retours d'affinage.

:::info
Démarrer un nouveau chat pour des tâches différentes rend également vos sessions plus efficaces — l'IA ne porte pas d'historique non pertinent d'une tâche précédente vers la suivante.
:::

## Conseils pour rédiger vos prompts

La manière dont vous formulez une demande influence directement la qualité de ce que ToolJet AI produit. Un prompt bien structuré donne à l'IA le contexte dont elle a besoin pour construire exactement ce que vous avez en tête.

### Incluez le contexte métier

Ne vous contentez pas de décrire l'outil — expliquez le problème qu'il résout. L'IA utilise ce contexte pour prendre de meilleures décisions concernant la structure, les données et les workflows.

**Au lieu de** : « Créer un CRM »
**Essayez** : « Notre équipe commerciale suit les prospects dans cinq feuilles de calcul, ce qui cause des doublons et des suivis manqués. Nous avons besoin d'un outil centralisé où les commerciaux peuvent enregistrer les prospects, les managers peuvent voir l'état du pipeline, et l'équipe reçoit des rappels pour les suivis en retard. »

### Définissez qui utilise l'outil

Décrivez les différents types d'utilisateurs et ce que chacun d'eux doit faire. Cela façonne la manière dont l'IA structure les accès, les vues et les workflows.

**Exemple** : « Les commerciaux doivent ajouter et mettre à jour des prospects. Les managers ont besoin d'une vue d'ensemble du pipeline et de métriques de performance d'équipe. Aucun autre accès n'est nécessaire. »

### Décrivez des parcours, pas seulement des fonctionnalités

Plutôt que de lister des fonctionnalités, décrivez comment les utilisateurs vont se déplacer dans l'outil étape par étape. Cela produit des applications plus cohérentes qu'une simple liste de fonctionnalités.

### Gardez des tâches ciblées

Envoyez une tâche ciblée à la fois plutôt que de regrouper plusieurs exigences dans un seul prompt. Des tâches plus petites et spécifiques sont plus faciles à exécuter correctement pour l'IA, et plus faciles à relire et affiner pour vous.

### Commencez petit, puis développez

Commencez par le workflow principal — trois ou quatre pages couvrant l'essentiel — puis ajoutez de la complexité après avoir validé les bases. Cela garde les premières sessions courtes, limite la consommation de contexte, et facilite les corrections de trajectoire.

Pour un guide complet sur la structuration des prompts avec des exemples, consultez [Prompting 101](/docs/build-with-ai/prompting101).
