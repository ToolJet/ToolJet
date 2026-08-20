---
id: customstyles
title: Styles personnalisés
---

<PlanBadge type="pro" />

La fonctionnalité Custom Styles de ToolJet permet aux utilisateurs d'appliquer leur propre CSS, en remplaçant les styles par défaut de l'application. Cela permet de personnaliser facilement l'apparence de l'application et de maintenir des thèmes cohérents sur toutes les applications ToolJet. En utilisant des styles standardisés, les utilisateurs évitent la tâche répétitive de styliser manuellement les composants pour chaque nouvelle application, ce qui améliore l'efficacité du développement et garantit une cohérence visuelle pour une expérience utilisateur fluide

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/customcss-v2.gif" alt="Custom CSS" /> 
</div>

## Appliquer des styles personnalisés à tous les composants

Suivez ces étapes pour appliquer des styles personnalisés dans vos applications ToolJet :

- Accédez à la page **Custom Styles** depuis **Workspace Settings** sur le dashboard ToolJet

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/custom-styles.png" alt="Custom CSS" />
</div>
<br/>

- Pour modifier les couleurs par défaut des composants, utilisez leurs noms de classe, qui suivent le format `_tooljet-<component>`. 

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/component-class.png" alt="Component Class" />
</div>
<br/>

- Vous devrez identifier la sous-classe spécifique (ou les balises HTML) de chaque composant pour cibler des attributs particuliers. L'inspecteur du navigateur vous permettra de trouver facilement la sous-classe (ou les balises HTML) des 
propriétés spécifiques. 

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/button-class-subclass.png" alt="Sub-Class" />
</div>
<br/>

- Une fois la sous-classe spécifique (ou la balise HTML) localisée, référencez-la dans la section **Custom Styles** et ajoutez-lui du style. Par exemple, pour le composant Button ci-dessus, le CSS ci-dessous modifiera la couleur de fond :

```css
._tooljet-Button button {
    background-color: #152A65 !important;
}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/button-component-customcss.png" alt="Button Custom CSS" />
</div>
<br/>

- De la même manière, le code ci-dessous peut être utilisé pour modifier la couleur de fond du bouton Filter d'un composant Table.

```css
._tooljet-Table .table-card-header button {
    background-color: #152A65 !important;
}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/filter-button-customcss.png" alt="Filter Custom CSS" />
</div>
<br/>

- Le code ci-dessous modifiera la taille et la couleur de police des libellés des champs Text Input et Number Input.

```css
._tooljet-TextInput p  {
	color: #152A65 !important;
    font-size: 16px !important;
    font-weight: bold !important;
}

._tooljet-NumberInput p  {
	color: #152A65 !important;
    font-size: 16px !important;
    font-weight: bold !important;
}
```
<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/input-fields-customcss.png" alt="Input Field Custom CSS" />
</div>


## Appliquer des styles personnalisés à des composants individuels

Pour modifier les couleurs de composants individuels, utilisez leurs noms de classe, qui suivent le format `_tooljet-<component_name>`. Ici, le nom du composant correspond au nom du composant tel que défini dans l'application.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/individual-class.png" alt="Individual Class Custom CSS" />
</div>
<br/>

- La couleur du composant Button ci-dessus peut être modifiée à l'aide du code ci-dessous :

```css
._tooljet-addIncomeButton button {
    background-color: blue !important;
}
```
<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/individual-customcss.png" alt="Individual Class Custom CSS" />
</div>
<br/>

En conclusion, la fonctionnalité Custom CSS vous permet de remplacer les styles par défaut par votre propre CSS. En offrant la flexibilité d'appliquer des personnalisations à la fois globales et spécifiques à un composant, cette fonctionnalité renforce la cohérence visuelle et l'image de marque de vos applications. cs
