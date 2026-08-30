---
id: page-nav
title: Implémenter la navigation à l'aide d'actions
sidebar_label: Naviguer à l'aide d'actions
---

ToolJet propose la navigation entre pages prête à l'emploi. Pour tout besoin de navigation personnalisée, comme la mise en place d'une barre de navigation, vous pouvez utiliser des gestionnaires d'événements et des actions. Vous pouvez également passer des paramètres de query lors de la navigation, ce qui facilite le partage de contexte entre les pages.

## Créer un menu de navigation personnalisé

Suivez ces étapes pour créer un menu de navigation personnalisé :

1. Ajoutez un container pour servir de conteneur de navigation.
2. Placez des icônes, du texte ou des composants button à l'intérieur du container pour chaque page vers laquelle vous souhaitez créer un lien.
3. Pour chaque élément de navigation :
    - Sélectionnez le composant (icône ou texte).
    - Ajoutez un gestionnaire d'événements.
        - Événement : **On click**
        - Action : **Switch page**
        - Page : *Sélectionnez la page cible dans le menu déroulant*

<img className="screenshot-full img-full" src="/img/app-builder/events/page-nav/nav-bar.png" alt="Events Architecture Diagram"/> <br/><br/>

Une fois configuré, cliquer sur un élément de navigation amènera l'utilisateur à la page correspondante.

<img className="screenshot-full img-full" src="/img/app-builder/events/page-nav/nav-dig.png" alt="Events Architecture Diagram"/>

## Transmettre des données entre les pages

Supposons que vous construisiez un système de gestion de tickets où la Page 1 affiche une liste de tous les tickets, et où cliquer sur un ticket redirige l'utilisateur vers la Page 2, qui affiche les détails du ticket sélectionné. Voici comment le configurer :

1. Sur la Page 1, affichez tous les tickets à l'aide d'un composant **Table**.
2. Ajoutez un gestionnaire d'événements à la table :
    - Événement : **Row clicked**
    - Action : **Switch page**
    - Page : **Page 2** *(Sélectionnez la page de détails du ticket.)*
    - Paramètres de query :
        - **Key** : `ticketId`
        - **Value** : `{{components.ticketTable.selectedRow.ticket_id}}`
3. Sur la Page 2, concevez l'interface pour afficher les détails du ticket.
4. Utilisez le paramètre de query pour récupérer ou afficher les données du ticket sélectionné :
    - Référencez-le avec : `{{globals.urlparams.ticketId}}`

Cette configuration permet aux utilisateurs de cliquer sur un ticket dans le tableau et de naviguer facilement vers une vue détaillée de ce ticket spécifique, les données nécessaires étant transmises entre les pages à l'aide de paramètres de query.
