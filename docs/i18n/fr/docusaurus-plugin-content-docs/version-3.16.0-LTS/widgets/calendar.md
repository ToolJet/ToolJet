---
id: calendar
title: Calendar
---

Le composant **Calendar** vous permet d'organiser et de planifier visuellement des événements. Vous pouvez définir la vue par défaut (jour, semaine ou mois), activer/désactiver diverses options d'affichage et lier des données aux événements et aux ressources.

<img className="screenshot-full" src="/img/widgets/calendar/calendar-component-v2.png" alt="ToolJet - Widget Reference - Calendar" />

:::info Restricted components
Certains composants ne peuvent pas être placés dans le **Popout** du composant **Calendar** :

- Calendar, Kanban.
  :::

## Propriétés

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"100px"}}> Description </div> |
| :--------------------------------------------- | :------------------------------------------------ |
| **Date Format** | Détermine le format dans lequel toute date transmise au calendrier via l'une des propriétés sera analysée. Il détermine également le format dans lequel toute date fournie par le calendrier via les variables exposées sera affichée. Il utilise les conventions de format de date de [moment.js](https://momentjs.com/). |
| **Default Date** | Détermine la date sur laquelle la vue du calendrier sera centrée. Par défaut, la date par défaut est définie sur la date actuelle en utilisant moment.js, c'est-à-dire `{{moment().format("MM-DD-YYYY HH:mm:ss A Z")}}`. Si le calendrier est en vue `month`, il affichera le mois dans lequel se trouve cette date. Si le calendrier est en vue `week`, il affichera la semaine dans laquelle se trouve cette date. Cette propriété doit être formatée en utilisant la propriété `Date format` configurable dans l'inspecteur. |

### Events

La propriété `Events` doit contenir un tableau d'objets, chacun décrivant les événements que le calendrier doit afficher.

En supposant que vous définissez le format de date sur `MM-DD-YYYY HH:mm:ss A Z`, définir la propriété `Events` avec l'extrait de code suivant affichera un événement intitulé `Sample Event` à la première heure de cette journée, comme illustré dans l'image du calendrier au début de cette page.

```javascript
{
  {
    [
      {
        title: "Sample event",
        start: `${moment().startOf("day").format("MM-DD-YYYY HH:mm:ss A Z")}`,
        end: `${moment().endOf("day").format("MM-DD-YYYY HH:mm:ss A Z")}`,
        allDay: false,
        tooltip: "Sample event",
        color: "lightgreen",
      },
    ];
  }
}
```

### Propriétés de l'objet événement

| <div style={{ width:"100px"}}> Nom </div> | <div style={{ width:"100px"}}> Description </div>                                                                      |
| :----------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **title**                                  | Titre de l'événement                                                                                                    |
| **start**                                  | La date (et l'heure) à laquelle cet événement commence. Doit être formatée selon le `Date format` que vous avez fourni              |
| **end**                                    | La date (et l'heure) à laquelle cet événement se termine. Doit être formatée selon le `Date format` que vous avez fourni                |
| **allDay**                                 | Optionnel. Qualifie l'événement comme un « événement toute la journée », qui l'épinglera aux en-têtes de date dans les vues `day` et `week` |
| **tooltip**                                | Infobulle qui sera affichée lorsque l'utilisateur survole l'événement                                                      |
| **color**                                  | Couleur d'arrière-plan de l'événement, tout nom de couleur ou code hex compatible CSS peut être utilisé                    |
| **textColor**                              | Couleur du titre de l'événement, tout nom de couleur ou code hex compatible CSS peut être utilisé                         |
| **textOrientation**                        | Optionnel. S'il est défini sur `vertical`, le titre de l'événement sera orienté verticalement.                              |
| **resourceId**                             | Applicable uniquement si vous utilisez la planification par ressource. Il s'agit de l'ID de la ressource à laquelle cet événement correspond. |

Vous pouvez fournir toute autre propriété supplémentaire aux événements. Ces propriétés supplémentaires vous seront accessibles lorsque le widget calendrier
exposera l'un des événements via ses variables exposées.

### Resources

La spécification de ressources fera en sorte que le calendrier catégorise les vues `week` et `day` pour chacune des ressources spécifiées.

Par exemple, pour catégoriser la vue semaine/jour pour trois salles, nous spécifions `resources` de cette façon :

```javascript
{
  {
    [
      { resourceId: 1, title: "Room A" },
      { resourceId: 2, title: "Room B" },
      { resourceId: 3, title: "Room C" },
    ];
  }
}
```

Si nous spécifions le `resourceId` de l'un des événements comme `1`, alors cet événement sera assigné à `Room A`, générant le calendrier suivant, en supposant que nous ayons défini la vue sur `day` et que nous consultions le jour où cet événement existe.

<img className="screenshot-full" src="/img/widgets/calendar/calendar-resource.png" alt="ToolJet - Widget Reference - Calendar" />

### Default View

Détermine si le calendrier affichera une vue `day`, `week` ou `month`. Définir cette propriété sur une valeur autre que ces valeurs fera basculer le calendrier par défaut sur la vue `month`.

La vue actuellement sélectionnée sera exposée sous la variable `currentView`.

### Start Time on Week and Day View

Ceci détermine l'heure à laquelle les cellules des vues semaine et jour commencent. Notez que ce champ accepte une date, mais que seules l'heure et le fuseau horaire (si fourni) sont extraits de cette date. La date doit être fournie dans le format de date choisi dans le premier champ de propriété.

### End Time on Week and Day View

Ceci détermine l'heure à laquelle les cellules des vues semaine et jour se terminent. Notez que ce champ accepte une date, mais que seules l'heure et le fuseau horaire (si fourni) sont extraits de cette date. La date doit être fournie dans le format de date choisi dans le premier champ de propriété.

### Show Toolbar

Détermine si la barre d'outils du calendrier doit être affichée ou non. Cliquez sur le bouton `Fx` pour déterminer programmatiquement la valeur du champ à `{{true}}` ou `{{false}}`.

### Show View Switcher

Détermine si les boutons du calendrier permettant à l'utilisateur de basculer entre les vues `month`, `week` et `day` seront affichés. Cliquez sur le bouton `Fx` pour déterminer programmatiquement la valeur du champ à `{{true}}` ou `{{false}}`.

### Highlight Today

Détermine si la carte du jour actuel sur le calendrier doit être mise en évidence ou non. Cliquez sur le bouton `Fx` pour déterminer programmatiquement la valeur du champ à `{{true}}` ou `{{false}}`.

### Show Popover When the Event is Clicked

Détermine s'il faut afficher une popover chaque fois qu'un événement est cliqué. Cliquez sur le bouton `Fx` pour déterminer programmatiquement la valeur du champ à `{{true}}` ou `{{false}}`.

## Événements

| Événement | Description |
| :--------: | :----------: |
| **On Event Selected** | Cet événement est déclenché lorsque l'utilisateur clique sur un événement du calendrier. Le dernier événement sélectionné est exposé sous `selectedEvent`. |
| **on Slot Selected**  | Cet événement est déclenché lorsque l'utilisateur clique soit sur un créneau du calendrier (cellule vide ou espace vide d'une cellule contenant un événement), soit lorsqu'il clique et fait glisser pour sélectionner plusieurs créneaux. Le(s) dernier(s) créneau(x) sélectionné(s) sont exposés sous `selectedSlots`. |
| **On Date Navigate**  | Cet événement est déclenché lorsque l'utilisateur clique sur les boutons `Today`, `Next` ou `Back` du calendrier. La date correspondante vers laquelle l'utilisateur a navigué sera exposée sous `currentDate`. |
|  **On View Change**   | Cet événement est déclenché lorsqu'une vue différente est sélectionnée par l'utilisateur. La vue actuelle est exposée sous `currentView`. |

:::info
Consultez la documentation [Action Reference](/docs/actions/run-query) pour obtenir des informations détaillées sur toutes les **Actions**.
:::

## Actions spécifiques au composant (CSA)

Il n'existe actuellement aucune CSA (action spécifique au composant) implémentée pour réguler ou contrôler le composant Calendar.

## Variables exposées

| Variables     | Description |
| ------------- | ----------- |
| selectedEvent | Cette variable stocke les informations sur l'événement qui a été choisi sur le composant calendrier. Cet objet comprend des clés comme **title**, **start**, **end**, **allDay** et **color**, et elles peuvent être accédées dynamiquement via JS en utilisant la syntaxe suivante : `{{components.calendar1.selectedEvent.title}}` ou `{{components.calendar1.selectedEvent.start}}`     |
| selectedSlots | La variable selectedSlots contient les valeurs des créneaux choisis sur le composant calendrier. Cet objet comprend des clés comme **slots**, **start**, **end**, **resourceId** et **action**, et elles peuvent être accédées dynamiquement via JS en utilisant la syntaxe suivante : `{{components.calendar1.selectedSlots.slots[0]}}` ou `{{components.calendar1.selectedSlots.end}}`. |
| currentView   | La variable currentView contient le type de vue actuellement défini sur le calendrier. La valeur se met à jour lorsque l'utilisateur change de vue depuis l'en-tête du calendrier. Types de vues prises en charge : `month`, `week` et `day`. La valeur peut être accédée en utilisant `{{components.calendar1.currentView}}` |
| currentDate   | La variable currentDate contient les données de la date actuelle. La date retournée par la variable est au format `MM-DD-YYYY HH:mm:ss A Z`. La valeur peut être accédée en utilisant `{{components.calendar1.currentDate}}` |

## Général

#### Tooltip

Un Tooltip est souvent utilisé pour préciser des informations supplémentaires sur quelque chose lorsque l'utilisateur survole le widget avec le pointeur de la souris. Sous l'accordéon <b>General</b>, vous pouvez définir la valeur au format chaîne. Le survol du widget affichera désormais la chaîne comme infobulle.

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"150px"}}> Description </div>       | <div style={{ width:"250px"}}> Options de configuration </div> |
| :------------------------------------------- | :------------------------------------------------------ | :---------------------------------------- |
| **Show on Desktop** | Activez ou désactivez pour afficher le widget en vue bureau. | La valeur peut être déterminée programmatiquement en cliquant sur `Fx` pour définir la valeur `{{true}}` ou `{{false}}`. |
| **Show on Mobile** | Activez ou désactivez pour afficher le widget en vue bureau. | La valeur peut être déterminée programmatiquement en cliquant sur `Fx` pour définir la valeur `{{true}}` ou `{{false}}`. |

## Styles

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:---------------|:------------|:---------------|
| Visibility | Contrôle la visibilité du composant. | Activez ou désactivez, ou définissez programmatiquement à l'aide de **fx**. |
| Cell size in views classified by resource | Contrôle la taille des cellules lorsque des ressources sont spécifiées. | Choisissez entre **Compact** ou **Spacious**. |
| Header date format on week view | Détermine le format de l'en-tête de colonne pour chaque jour en vue semaine. | Saisissez un format de date selon la norme momentjs (par défaut : `DD MMM`). |
| Border color | Définit la couleur de bordure du calendrier. | Sélectionnez une couleur dans le sélecteur de couleur ou définissez-la programmatiquement à l'aide de **fx**. |
| Border radius | Définit le rayon de coin du calendrier. | Saisissez une valeur numérique (par défaut : `6`) ou définissez-la programmatiquement à l'aide de **fx**. |

### Advanced

| <div style={{ width:"100px"}}> Propriété </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Options de configuration </div>|
|:----------------|:------------|:--------------|
| CSS class | Ajoute une classe CSS personnalisée au composant, qui peut être ciblée via les **[Custom Styles](/docs/app-builder/customstyles)** pour un style avancé. | Saisissez un ou plusieurs noms de classe. |

:::info
La section **Advanced** est disponible uniquement si votre plan inclut la fonctionnalité **[Custom Styles](/docs/app-builder/customstyles)**.
:::

:::info
Toute propriété ayant le bouton **fx** à côté de son champ peut être **configurée programmatiquement**.
:::
