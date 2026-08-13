---
id: create-module
title: Créer un module
---

Un module est une interface réutilisable qui peut être importée dans des applications. Il vous permet de créer une fonctionnalité complexe une seule fois et de la réutiliser dans plusieurs applications sans avoir à réécrire le code chaque fois. Ce guide explique comment créer et utiliser un module dans ToolJet.

### Créer un module

Suivez ces étapes pour commencer à créer un module :

1. Accédez à la section **Modules** depuis le tableau de bord ToolJet.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/app-builder/modules/dashboard.png" alt="Dashboard" /> 
2. Cliquez sur le bouton **Create Module**. Dans la fenêtre contextuelle, saisissez un nom pour le module.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/modules/create-module-modal.png" alt="Create Module" />
3. Ajoutez des composants, des queries et des actions comme vous le feriez dans une application normale. Placez et redimensionnez vos composants sur le **Module container**.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/app-builder/modules/module-builder.png" alt="Module Builder" />
4. Cliquez sur le module container pour ouvrir le panneau des propriétés. Vous y trouverez les **Input** et **Output** qui aident à définir la manière dont le module communique avec l'application parente. Ces paramètres définissent la façon dont le module communique avec l'application parente, ce qui facilite la création de modules dynamiques et réutilisables fonctionnant avec différents ensembles de données et queries. Consultez le guide [Configurer les entrées et les sorties](/docs/app-builder/modules/input-output) pour en savoir plus.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/modules/module-container-property.png" alt="Properties Panel" /> 

### Utiliser un module

Une fois qu'un module est créé, il devient disponible dans la section **Module** du panneau de composants à l'intérieur de l'App-Builder. Vous pouvez l'utiliser comme tout autre composant en le déposant sur le canvas et en le configurant.

1. Ouvrez l'application dans laquelle vous souhaitez utiliser un module.
2. Dans le panneau de la bibliothèque de composants, passez à la section **Module**.
3. **Faites glisser et déposez** le module sur le canvas.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/app-builder/modules/use-module.png" alt="Module Builder" />
5. Vous pouvez sélectionner le module pour voir une liste des **inputs** requis (le cas échéant) définis dans le module.
6. Liez les entrées à des valeurs provenant de votre source de données ou configurez des valeurs statiques si nécessaire.
7. Si votre module dispose de **outputs**, vous pouvez les référencer en utilisant :
   ```js
   {{components.<module_name>.<output_name>}}
   ```

Vous pouvez réutiliser le même module plusieurs fois dans une même application en le déposant plusieurs fois sur le canvas et en configurant chaque instance avec des liaisons d'entrées différentes.

Veuillez consulter la documentation **[Entrées et Sorties](/docs/app-builder/modules/input-output)** pour des informations détaillées sur la manière de gérer les entrées et les sorties d'un module.
