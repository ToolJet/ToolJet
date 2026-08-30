---
id: debug-components
title: "Déboguer les composants"
---

Lors de la création d'applications en langage naturel dans ToolJet, les composants peuvent parfois être générés avec des configurations incomplètes ou incorrectes, comme des liaisons cassées ou des expressions invalides. Ces problèmes peuvent entraîner des erreurs d'exécution et perturber votre workflow.

Désormais, vous pouvez corriger ces erreurs dans les composants avec l'IA. Cette nouvelle fonctionnalité est conçue pour simplifier le processus de débogage grâce à des suggestions contextuelles directement au point de défaillance. Plutôt que de changer de contexte ou de résoudre les problèmes manuellement, vous pouvez résoudre les erreurs rapidement avec l'assistance de l'IA directement dans l'éditeur de propriétés du composant.


## Comment ça fonctionne ?

Si une propriété de composant contient une erreur, vous verrez un message d'erreur dans le code hinter. Sous ce message, un bouton **Fix with AI** apparaît. Ce bouton ne s'affiche que lorsqu'il y a une erreur réelle ; une fois l'erreur résolue, le bouton disparaît.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}}  src="/img/tooljet-ai/fix-with-ai/code-hinter-error.png" alt="Fix with AI button in the code hinter" />

Cliquer sur **Fix with AI** ouvre une mini fenêtre de chat, ancrée juste à côté de l'erreur, qui sait de quel composant et de quelle propriété provient le problème. Cela signifie que vous n'avez pas besoin de réexpliquer le problème. L'IA voit le composant défaillant, le message d'erreur, et le corrige pour vous. Il s'agit d'un chat à action unique qui ne conserve pas le contexte des corrections précédentes.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}}  src="/img/tooljet-ai/fix-with-ai/ai-processing.png" alt="AI processing the response" />

Une fois la correction prête, cliquez sur **Apply fix**, ou vous avez également la possibilité de régénérer la correction si vous pensez qu'elle nécessite plus de travail. En cliquant sur **Apply fix**, l'IA appliquera la correction à la propriété du composant et vous verrez la configuration mise à jour du composant.
<img className="screenshot-full img-l" src="/img/tooljet-ai/fix-with-ai/apply-fix.png" alt="Apply Fix to your component property" />


## Cas d'usage

Supposons que vous construisiez une application de gestion des commandes dans laquelle vous avez un composant table, et que les données chargées dans la table comportent des expressions incorrectes provoquant des erreurs d'exécution. Vous pouvez désormais utiliser le bouton **Fix with AI** pour corriger ces expressions, comme illustré dans l'image ci-dessous.

<img className="screenshot-full img-full" style={{marginBottom:"15px"}}  src="/img/tooljet-ai/fix-with-ai/example.png" alt="Fix with AI example" />

Le **Fix with AI** de ToolJet facilite la correction des erreurs en utilisant l'IA pour vous aider dès qu'un problème survient. Qu'il s'agisse d'une petite erreur dans votre logique ou d'un problème avec votre expression, cette fonctionnalité vous aide à la corriger rapidement afin que vous puissiez continuer à construire sans être bloqué ou distrait.
