---
id: scheduler
title: Déclencher via un planificateur
---

<PlanBadge type="team" />

Vous pouvez automatiser l'exécution des workflows en ajoutant des déclencheurs planifiés qui s'exécutent à intervalles réguliers. Utilisez le **mode Interval** pour définir la fréquence avec des options prédéfinies, ou le **mode Cron** pour un contrôle plus granulaire avec la syntaxe cron. Vous pouvez également spécifier un fuseau horaire pour que la planification corresponde à l'heure locale.

## Types de planification

### Mode Interval

Le mode Interval est idéal pour des planifications simples. Par exemple, vous pouvez déclencher des tâches toutes les 10 minutes, exécuter des mises à jour horaires, ou lancer des routines hebdomadaires. Spécifiez simplement l'intervalle en minutes, heures, jours, semaines ou mois selon vos besoins.
<img className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/interval-mode.png" alt="Planificateur - Mode Interval" />

### Mode Cron

Le mode Cron offre une planification précise à l'aide de la syntaxe cron. Il est parfait pour des tâches telles que l'exécution quotidienne de workflows à 3h15, le déclenchement d'actions tous les 15 du mois, ou la planification de processus uniquement en semaine. Avec des expressions cron comme 0 9 \* \* 1 (tous les lundis à 9h), vous pouvez affiner vos déclencheurs facilement.
<img className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/cron-job.png" alt="Planificateur - Mode Cron" />

## Exécuter un workflow à l'heure planifiée

### À intervalles réguliers

1. Créez et configurez un workflow. Consultez le guide [Aperçu des workflows](/docs/workflows/overview/) pour créer un nouveau workflow.
2. Accédez à la section Triggers dans le panneau de gauche. Cliquez sur **Schedules**. Puis cliquez sur **+ New schedule**. Sélectionnez **Interval** comme Label. <br/>
   <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/new-schedule.png" alt="Planificateur - Mode Interval" />
3. Remplissez les champs requis.
   - **Timezone** : Sélectionnez le fuseau horaire local sur lequel vous souhaitez déclencher le workflow.
   - **Run every** : Sélectionnez l'intervalle auquel vous souhaitez exécuter le workflow.
   - **Environment** : Sélectionnez l'environnement sur lequel vous souhaitez exécuter le workflow.
     <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/set-interval.png" alt="Planificateur - Mode Interval" />
4. Cliquez sur **+ Create schedule** pour créer et enregistrer la planification. Par défaut, la planification est inactive ; activez le bouton pour l'activer. <br/>
   <img style={{ marginTop: '15px' }} className="screenshot-full img-s" src="/img/workflows/triggers/scheduler/enable.png" alt="Planificateur - Mode Interval" />

### Selon une planification Cron

Vous pouvez utiliser la syntaxe Cron pour configurer une planification. ToolJet propose une interface graphique pour configurer une planification cron.

1. Créez et configurez un workflow. Consultez le guide [Aperçu des workflows](/docs/workflows/overview/) pour créer un nouveau workflow.
2. Accédez à la section Triggers dans le panneau de gauche. Cliquez sur **Schedules**. Puis cliquez sur **+ New schedule**. Sélectionnez **Cron** comme Label. <br/>
   <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/cron-new-schedule.png" alt="Planificateur - Mode Interval" />
3. Remplissez les champs requis.
   - **Timezone** : Sélectionnez le fuseau horaire local sur lequel vous souhaitez déclencher le workflow.
   - Planifiez le moment où vous souhaitez déclencher le workflow.
   - **Environment** : Sélectionnez l'environnement sur lequel vous souhaitez exécuter le workflow.
     <img style={{marginTop:'15px'}} className="screenshot-full img-m" src="/img/workflows/trigger-schedule/cron-schedule.png" alt="Accéder à la section Workflow" /> <br/>
     Dans l'image ci-dessus, le workflow est planifié pour se déclencher à la 15e minute de chaque heure ; vous pouvez également le vérifier sous le champ environnement. Vous pouvez consulter **[ce site](https://crontab.guru/)** pour générer une planification cron.
4. Cliquez sur **+ Create schedule** pour créer et enregistrer la planification. Par défaut, la planification est inactive ; activez le bouton pour l'activer. <br/>
   <img style={{ marginTop: '15px' }} className="screenshot-full img-s" src="/img/workflows/triggers/scheduler/enable.png" alt="Planificateur - Mode Interval" />
