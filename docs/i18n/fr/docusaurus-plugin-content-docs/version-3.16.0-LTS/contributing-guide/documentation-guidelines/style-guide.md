---
id: style-guide
title: Style Guide
---

Bienvenue dans le guide de style de ToolJet pour créer une documentation claire, cohérente et accessible. Dans ce guide, vous trouverez des recommandations sur le formatage du texte, l'utilisation correcte des en-têtes, le style des extraits de code, les pratiques d'accessibilité, et bien plus encore.

## 1. Directives de formatage du texte

Les différents éléments de vos projets doivent être formatés de manière cohérente pour plus de clarté. Voici quelques recommandations :

a. L'italique est utilisé pour les noms donnés aux Queries, aux tables de base de données et aux composants.

**Exemples :**

- Créez une nouvelle query et renommez-la en _getEmployees_.
- Sélectionnez **ToolJetDB** comme source de données et la table _Employees_ comme table source.
- Transmettez les données renvoyées au composant _allEmployees_.

b. Le gras est appliqué pour les Workspace Constants, les boutons cliquables, fx, les sources de données et les composants.

**Exemples :**

- Sélectionnez le composant **Button** et changez son libellé en "Save".
- Faites glisser-déposer un composant **Table** et renommez-le en _todosTable_.
- Développez le panneau de query en bas et cliquez sur le bouton **Add** pour créer une nouvelle query **REST API**.

c. Utilisez des apostrophes simples pour le code en ligne et des triples apostrophes pour le code multi-lignes.

**Exemples :**

- L'option **fx** située à côté de la propriété Loading state peut être utilisée pour ajouter un loader au composant. Par exemple, vous pouvez entrer `{{queries.getData.isLoading === true}}` pour afficher le loader pendant l'exécution de la query _getData_.
- Utilisez le code ci-dessous pour récupérer des données :

```js
// this code is wrapped in triple ticks
const fetchData = async () => {
  const response = await api.get("/users");
  console.log(response.data);
};
```

**Éléments supplémentaires** :

- Points de terminaison API : utilisez des apostrophes de code pour les points de terminaison API (par exemple, `GET /api/v1/resources`).
- Libellés ou saisies utilisateur : utilisez des guillemets doubles pour mettre en évidence les libellés ou les saisies utilisateur (par exemple, "Enter your username").

---

## 2. Titres

Une utilisation correcte des en-têtes est essentielle pour organiser le contenu et améliorer la lisibilité. Utilisez les directives suivantes pour déterminer quel niveau d'en-tête appliquer :

- **Casse de titre** : appliquez la casse de titre à tous les en-têtes pour maintenir la cohérence.
- **En-tête principal** : utilisez un seul dièse (`#`) pour le sujet principal du document ou de la section. Il doit être utilisé une seule fois par document pour l'en-tête principal.
- **En-tête secondaire** : utilisez un double dièse (`##`) pour les sous-thèmes ou les sections principales au sein d'une section majeure. Ce niveau d'en-tête doit organiser le contenu sous l'en-tête principal.
- **En-tête tertiaire** : utilisez un triple dièse (`###`) pour des points plus détaillés ou des sous-sections sous un en-tête secondaire. Cet en-tête est utile pour approfondir des détails spécifiques au sein d'une section.
- **En-tête quaternaire** : utilisez quatre dièses (`####`) pour des détails encore plus granulaires au sein d'une section tertiaire. Cet en-tête est rarement nécessaire mais peut être utile dans une documentation complexe.
- **Espacement** : assurez-vous qu'il y a une ligne vide avant et après chaque en-tête pour maintenir la lisibilité et séparer clairement les sections.
- **Fréquence des en-têtes** : évitez d'utiliser plus de trois niveaux d'en-têtes pour ne pas trop complexifier le document. Si un niveau de détail supplémentaire est nécessaire, envisagez de scinder le contenu en sections ou documents distincts.

---

## 3. Tableaux Markdown

Pour présenter efficacement des informations étendues et répétitives sur des fonctionnalités, telles que les propriétés d'un composant, utilisez des tableaux markdown. Ce format aide à organiser et à afficher les données de manière claire et concise.

Assurez-vous que tous les tableaux sont alignés à gauche pour plus de cohérence. Cela améliore la lisibilité et garantit que le contenu est facile à parcourir.

**Exemple** :
| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:---------- | :---------- | :------------ |
| chartTitle | Contient le titre du composant chart. | Accessible dynamiquement via JS (par exemple, `{{components.chart1.chartTitle}}`). |
| xAxisTitle | Contient le titre de l'axe X du chart. | Accessible dynamiquement via JS (par exemple, `{{components.chart1.xAxisTitle}}`). |
| yAxisTitle | Contient le titre de l'axe Y du chart. | Accessible dynamiquement via JS (par exemple, `{{components.chart1.yAxisTitle}}`). |
| clickedDataPoints | Stocke les détails des points de données qui ont été cliqués.| Accessible dynamiquement via JS (par exemple, `{{components.chart1.clickedDataPoints}}`). Chaque point de données inclut `xAxisLabel`, `yAxisLabel`, `dataLabel`, `dataValue` et `dataPercent`. |

- Utilisez le formatage **gras** pour tous les en-têtes de colonne afin de les différencier du contenu du tableau.
- Évitez de laisser des cellules vides dans les tableaux. Si une cellule n'a pas de contenu applicable, utilisez un texte de remplacement tel que "N/A" ou "—" pour indiquer que la cellule est intentionnellement vide.

---

## 4. Admonitions

Les admonitions sont des blocs de contenu conçus pour attirer l'attention sur des points spécifiques de votre documentation. Utilisez-les avec parcimonie afin de ne pas submerger l'utilisateur. Réservez les admonitions aux informations critiques ou d'avertissement uniquement.

- **Admonitions de type Warning** : utilisez les admonitions de type `warning` pour les actions à haut risque ou les modifications irréversibles. Ce type d'admonition doit alerter les utilisateurs sur des dangers potentiels ou des problèmes critiques.

**Exemple** :
:::warning
Assurez-vous de sauvegarder vos données avant de passer à la dernière version.
:::

- **Admonitions de type Tip** : utilisez les admonitions de type `info` pour proposer des astuces utiles ou des bonnes pratiques. Elles sont généralement positives et apportent une valeur supplémentaire à l'utilisateur.

**Exemple** :
:::info
Prévisualisez les modifications avant de les pousser (push).
:::

Un usage excessif peut diluer leur impact. Privilégiez _l'italique_ plutôt que les admonitions dans la mesure du possible pour mettre en évidence des informations importantes. C'est un moyen moins intrusif d'attirer l'attention sur des détails clés.

---

## 5. Directives sur les images

Incluez des images qui correspondent étroitement à des cas d'usage réels. Cela rend la documentation plus pratique et plus proche de l'utilisateur.

- Nommez les images pour refléter leur objet, par exemple `create-get-query.jpeg`. Cela permet de maintenir une structure de fichiers organisée et de localiser plus facilement des images spécifiques.
- Alignez les images à gauche. C'est l'alignement standard qui fonctionne bien avec la plupart des mises en page de contenu.
- Réglez la largeur de l'image à 100 % pour qu'elle s'adapte correctement aux différentes tailles d'écran.
- Conservez des images de moins de 300 ko pour équilibrer vitesse de chargement et qualité.
- Le texte alternatif doit être une description concise de l'image, fournissant la même information que l'image elle-même. C'est essentiel pour l'accessibilité et pour les utilisateurs qui dépendent des lecteurs d'écran.
- Évitez les formulations comme "image de" ou "graphique de", car les lecteurs d'écran les gèrent automatiquement. Concentrez-vous sur la description de ce qui est important dans l'image.
- Utilisez les formats `WEBP` ou `PNG` pour les images web en raison de leur bon équilibre entre qualité et taille de fichier.
- Utilisez `SVG` pour les logos ou icônes afin de garantir une mise à l'échelle sans perte de qualité.

---

## 6. Ton et clarté

Maintenir un ton clair et cohérent dans toute votre documentation est essentiel pour une communication efficace. L'objectif est d'être concis, informatif et convivial.

- Gardez un langage simple et concis. Évitez le jargon sauf s'il est essentiel pour le public visé, et fournissez des explications lorsque nécessaire.
- Relisez toujours le contenu avec Grammarly ou un outil similaire avant de soumettre une PR. Cela permet de repérer les erreurs qui pourraient être manquées lors de la rédaction initiale.
- Utilisez la voix active autant que possible pour rendre le contenu plus direct et engageant. La voix passive peut rendre les phrases plus longues et plus difficiles à comprendre.

---

## 7. Puces

Utilisez des puces pour décomposer les étapes ou les listes afin d'améliorer la clarté. Cela rend le contenu plus facile à parcourir et à comprendre.

- Évitez d'utiliser des puces pour un seul élément. S'il n'y a qu'un seul point à mentionner, intégrez-le plutôt dans le texte principal.
- Assurez-vous que les sous-points sont correctement indentés en markdown. Cela préserve la hiérarchie et la relation entre le point principal et les sous-points.
- Terminez par un point les puces qui constituent des phrases complètes. Cela permet de maintenir une grammaire et une lisibilité correctes.
- N'insérez pas de lignes vides entre les puces. Cela garde la liste compacte et visuellement liée.
- Utilisez des puces imbriquées pour les éléments nécessitant une explication supplémentaire ou une hiérarchie au sein d'une liste.

---

## 9. Directives linguistiques spécifiques

Utilisez les directives linguistiques ci-dessous pour garantir clarté et cohérence.

### Formatage HTTP

- Tous les en-têtes HTTP doivent être capitalisés ainsi : `First-Letter-Capitalized`. Cela suit la convention standard et rend les en-têtes plus faciles à distinguer.
  **Exemple** :

```
Content-Type: application/json
Authorization: Bearer <token>
```

- Les blocs HTTP doivent être prêts à être exécutés une fois collés dans des outils comme Postman ou des commandes `cURL`. Cela signifie qu'ils doivent inclure tous les éléments nécessaires comme les en-têtes, le corps et la méthode. **Exemple** :

```bash
curl -X POST https://api.example.com/resource \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <token>' \
-d '{"key": "value"}'
```

### Directives JavaScript

- Terminez les instructions par des points-virgules (`;`). Bien que JavaScript puisse souvent déduire les points-virgules, les inclure explicitement évite des problèmes potentiels, en particulier dans du code complexe. **Exemple** :

```javascript
const name = "John";
console.log(name);
```

- Utilisez des guillemets simples pour les chaînes de caractères, sauf si les guillemets doubles sont nécessaires (par exemple, pour éviter d'échapper des guillemets simples à l'intérieur de la chaîne). **Exemple** :

```javascript
const greeting = "Hello, world!";
```

### Formatage JSON

- Indentez le JSON avec 2 espaces. C'est une pratique standard qui améliore la lisibilité. **Exemple** :

```json
{
  "name": "John Doe",
  "age": 30,
  "city": "New York"
}
```

- Évitez les commentaires dans le code JSON, car JSON ne prend pas nativement en charge les commentaires. Si des explications sont nécessaires, fournissez-les en dehors du bloc JSON dans la documentation.

### Scripts shell

- Décomposez les commandes distinctes en blocs de code séparés ou enchaînez-les avec `&&` pour plus de lisibilité. Pour les commandes multi-lignes, utilisez `\` pour couper les lignes. **Exemple** :

```bash
sudo apt-get update && \
sudo apt-get install -y curl
```

- Faites précéder les commentaires de `#` pour expliquer l'objectif de la commande.
  **Exemple** :

```bash
# This command installs Node.js
sudo apt-get install -y nodejs
```

### Requêtes SQL

- Formatez les requêtes SQL avec les mots-clés en majuscules, et décomposez les requêtes longues sur plusieurs lignes pour une meilleure lisibilité. **Exemple** :

```sql
SELECT name, age, city
FROM users
WHERE age > 30
ORDER BY name ASC;
```

---

## 10. Directives de liens

- Utilisez des chemins relatifs à la racine (par exemple, `/schema/postgres/tables.mdx`) plutôt que des liens relatifs afin d'éviter les liens brisés lors des déplacements de fichiers. Cette pratique garantit que les liens restent fonctionnels même si les fichiers sont déplacés dans la structure des répertoires. **Exemple** : <br/>
  `[Postgres tables](/schema/postgres/tables.mdx)` renvoie vers la page des tables Postgres.

- Lorsque vous créez un lien vers une section spécifique d'une page, utilisez des liens d'ancrage pour diriger précisément l'utilisateur vers l'endroit voulu. **Exemple** : <br/>
  `ToolJet supports [multiple environments,](https://docs.tooljet.com/docs/#multiple-environments)` amène l'utilisateur directement à la section spécifique.

---

## 11. Sémantique et terminologie

- Écrivez à la deuxième personne (par exemple, _vous_, _votre_). Cela rend le contenu plus engageant et directement applicable au lecteur.
- Assurez-vous que la sensibilité à la casse est appliquée de manière cohérente dans tout le document, en particulier pour les termes techniques ou les commandes. C'est important pour les commandes et les variables dans le code qui sont sensibles à la casse.
  **Exemple** : <br/>"`MyVariable` et `myvariable` ne sont pas identiques."
- Définissez les acronymes lors de leur première utilisation et évitez de les utiliser de manière excessive pour préserver la lisibilité. Cela aide les lecteurs qui ne connaissent pas forcément tous les acronymes.
  **Exemple** : <br/>"Le Content Delivery Network (CDN) est utilisé pour livrer du contenu aux utilisateurs de manière efficace."
- Maintenez une terminologie cohérente dans tout le document. Si vous commencez avec "user", ne passez pas ensuite à "customer" dans le même contexte.

---

En suivant ces directives, vous pouvez garantir que votre documentation est claire, cohérente et facile à utiliser pour un large éventail de publics.
