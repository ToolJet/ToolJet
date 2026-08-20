---
id: transforming-data
title: Transformer les données
---

Les transformations vous aident à nettoyer vos données avant de les transmettre aux composants de l'UI. Lorsque vous créez des applications, les données brutes récupérées depuis une API ou une base de données doivent souvent être adaptées avant d'être affichées dans les composants. Vous pourriez avoir besoin de :

-	 Convertir des horodatages ISO bruts au format DD/MM/YYYY.
-	 Aplatir des objets profondément imbriqués pour les utiliser dans des tableaux ou des listes déroulantes.
-	 Convertir des valeurs de devise, de distance ou de température avant leur affichage.
-	 Ajuster les noms de champs pour correspondre aux attentes des composants.

C'est là qu'interviennent les transformations de données. Elles vous aident à façonner vos données backend dans un format adapté au frontend, ce qui garde votre logique d'UI simple et votre application plus facile à maintenir.

Vous pouvez écrire du code de transformation en JavaScript ou en Python. Imaginons que vous créez un tableau de bord de gestion des employés, et que votre API getEmployees renvoie beaucoup de données superflues :

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+91876543210",
    "department_id": 1,
    "salary": "$50k"
  },
  { ... }
]
```

Mais dans votre tableau, vous souhaitez uniquement afficher les champs *id*, *name*, *designation*. Plutôt que de modifier l'API ou de filtrer manuellement les données dans chaque composant, vous pouvez transformer les données une seule fois, au niveau de la requête.

## Utiliser JavaScript

Rendez-vous dans l'onglet Transformations de votre requête et écrivez votre code javascript :

```javascript
return data.map(item => ({
	id: item.id,
	name: item.name,
	designation: item.designation
}));
```

Cela garantit qu'à chaque exécution de la requête, vos composants reçoivent exactement la forme de données dont ils ont besoin.

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/transformation_js.png" alt="App Builder: query transformations"/>

## Utiliser Python

Si vous êtes plus à l'aise avec Python, changez simplement le langage dans l'onglet de transformation et utilisez une approche similaire :

```python
[
    {"id":item['id'],
     "name": item['name'],
     "designation": item['designation']
    } for item in data
]
```

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/transformation_python.png" alt="App Builder: query transformations"/>

Les transformations vous offrent un moyen simple d'ajuster vos données avant de les utiliser dans vos applications.
