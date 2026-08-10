---
id: markdown
title: Syntaxe Markdown prise en charge
---

Dans ToolJet, le Chat Component prend en charge le formatage Markdown à la fois pour les réponses et les messages. Cela peut être utilisé pour améliorer le formatage du texte grâce à la syntaxe Markdown, rendant les conversations plus lisibles et structurées.

## Syntaxe Markdown prise en charge

#### Titres

| <div style = {{ width:'200px' }}> Titre </div> | <div style = {{ width:'200px' }}> Format </div> |
|:-------:|:------:|
| H1 | `# Heading`|
| H2 | `## Heading` |
| H3 | `### Heading` |
| H4 | `#### Heading` |
| H5 | `##### Heading` |
| H6 | `###### Heading` |

#### Formatage du texte

##### Gras

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
**Text**
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat : 

**Text**

</div>

</div>

##### Italique

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
*Text*
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat : 

*Text*

</div>

</div>

##### Gras et italique

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
***Text***
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat : 

***Text***

</div>

</div>

##### Barré

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
~~Text~~
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat : 

~~Text~~

</div>

</div>

#### Listes

##### Listes non ordonnées

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
- Item 1
- Item 2
  - Nested Item 2.1
  - Nested Item 2.2
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :
- Item 1
- Item 2
  - Nested Item 2.1
  - Nested Item 2.2

</div>

</div>


##### Listes ordonnées

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
1. First Item
2. Second Item
   1. Nested Item 2.1
   2. Nested Item 2.2
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :
1. First Item
2. Second Item
   1. Nested Item 2.1
   2. Nested Item 2.2

</div>

</div>


##### Listes de tâches

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
- [x] Completed task
- [ ] Pending task
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :
- [x] Completed task
- [ ] Pending task

</div>

</div>

#### Code

##### Code en ligne

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
This is `inline code`.
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :

This is `inline code`.
</div>

</div>

##### Bloc de code

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
\```javascript
const hello = "world";
console.log(hello);
\```
```
Remarque : Veuillez retirer `\` de la syntaxe.

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :
```javascript
const hello = "world";
console.log(hello);
```
</div>

</div>

#### Citations

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
> Single level quote
>> Nested quote
>>> Deep nested quote
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :
> Single level quote
>> Nested quote
>>> Deep nested quote
</div>

</div>

#### Liens et images

##### Liens

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
[Link Text](https://example.com)
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :

[Link Text](https://example.com)

</div>

</div>

##### Image

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
![Image Alt Text](https://images.unsplash.com/photo-1509966756634-9c23dd6e6815?q=80&w=3176&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :

![Image Alt Text](https://images.unsplash.com/photo-1509966756634-9c23dd6e6815?q=80&w=3176&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

</div>

</div>

#### Tableaux

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
| Header 1 | Header 2 |
|-----------|-----------|
| Cell 1    | Cell 2    |
| Cell 3    | Cell 4    |
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :

 Header 1 | Header 2 |
|-----------|-----------|
| Cell 1    | Cell 2    |
| Cell 3    | Cell 4    |

</div>

</div>

#### Traits horizontaux

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
--- 
OR
___
OR
***
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :

--- 

</div>

</div>

#### Contenu HTML

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
<div style="color: blue;">
  Colored text
</div>
<table>
  <tr>
    <td>HTML Table</td>
  </tr>
</table>
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :

<div style = {{ color: 'blue'}}>
  Colored text
</div>
<table>
  <tr>
    <td>HTML Table</td>
  </tr>
</table>

</div>

</div>

#### Notes de bas de page

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format : 
```
Here's a sentence with a footnote[^1].

[^1]: This is the footnote.
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Résultat :

Here's a sentence with a footnote[^1].

[^1]: This is the footnote.

</div>

</div>
