---
id: display-listview-record-on-new-page
title: Afficher les détails d'un enregistrement Listview sur une nouvelle page
---

Le widget **ListView** vous permet d'afficher des données structurées dans une mise en page répétable. Vous pouvez le configurer pour naviguer vers une autre page et afficher des informations détaillées sur un enregistrement sélectionné.

Pour ce guide, nous allons utiliser l'un des modèles existants de ToolJet : **Employee Time Tracker**

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/display-listview-record-on-new-page/overview1.png" alt="App's overview"  />

## Créer l'application

### Configuration de la requête

- Créez une requête nommée **`get_employees`** configurée pour récupérer des enregistrements depuis une table de base de données telle que **`ett_employee_details`**

- Sélectionnez l'opération **List rows** et sélectionnez le mode **GUI**

### Configuration des données du ListView

- Faites glisser le widget **ListView** depuis la section Components sur le canevas, et liez la propriété Data à :

```javascript
 {{queries.get_employees.data}}
 ```
Chaque objet employé sera désormais rendu comme un élément ListView.

- À l'intérieur du ListView, ajoutez des widgets Text et liez-les en utilisant :

```javascript
{{listItem.name}}
{{listItem.designation}}
{{listItem.department}} 
```
Ici, `listItem` représente l'objet employé en cours de rendu.

<img className="screenshot-full img-full" src="/img/how-to/display-listview-record-on-new-page/get-employees-query.png" alt="Add a new page"  />

## Configuration des gestionnaires d'événements
Ajoutez un nouveau gestionnaire d'événement au composant **Listview** avec les configurations suivantes :

1. - Événement : **Record Clicked**
   - Action : **Set variable**
   - Key : **selected_emp** *(Saisissez le nom de variable souhaité.)*
   - Value : 

    ```json
    {{[{ 
    name: components.listview1.selectedRecord.emp_name.text,
    designation: components.listview1.selectedRecord.emp_designation.text,
    department: components.listview1.selectedRecord.emp_dept.text 
    }]}}
    ```
    <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/display-listview-record-on-new-page/set-variable-eh.png" alt="Add event handler to set variables"/>

2. - Événement : **Record Clicked**
   - Action : **Switch Page** 
   - Page : **Employee Details**

    <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/display-listview-record-on-new-page/switch-page-eh.png" alt="Add event handler to switch page"/> 


## Afficher l'enregistrement sélectionné sur une autre page

Après avoir configuré les gestionnaires d'événements et paramétré le ListView pour naviguer vers une page de détails avec des paramètres, la page de destination doit consommer les données transmises et afficher les détails d'enregistrement appropriés.

Sur la page de destination, ces données sont accessibles via **`{{variables.selectedEmp[0].name}}`**

<img className="screenshot-full img-full" src="/img/how-to/display-listview-record-on-new-page/overview2.png" alt="Display data on the new page" />
