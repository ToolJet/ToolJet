---
id: control-component
title: Control component (Component Specific Actions)
---

L'action **Control Component** invoque une Component-Specific Action (CSA) — une action exclusive exposée par un composant particulier, comme définir la valeur d'un Text Input ou la réinitialiser. Les CSA peuvent être déclenchées soit via des gestionnaires d'événements, soit depuis une requête RunJS.

Vous pouvez trouver la liste des CSA disponibles pour un composant spécifique dans la documentation propre à ce composant. Par exemple, les CSA du composant **Bounded Box** sont listées dans la documentation [Bounded Box](/docs/widgets/bounded-box).

## Configuration

| Paramètre | Description | Par défaut |
| --- | --- | --- |
| Component | Le composant cible dont vous souhaitez invoquer la CSA | — |
| Action | La CSA à invoquer sur le composant sélectionné (par ex. `Set text`, `Clear`) | — |
| Champs spécifiques à l'action | Les champs supplémentaires dépendent de la CSA sélectionnée (par ex. le champ `Text` pour `Set text`) | — |
| Debounce | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/controlcomponent/event.png" alt="ToolJet - Action reference -  Control Component"/>

:::info
Découvrez la **[démo](https://youtu.be/JIhSH3YeM3E)** des Component Specific Actions présentée lors d'un de nos community calls.
:::
