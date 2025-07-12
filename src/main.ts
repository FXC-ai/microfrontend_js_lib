import { CalendarDensity } from './d3CalendarDensity/CalendarDensity.js';
import { DataGantt, Gantt } from './Gantt/Gantt.js';
import { DataStackedHorizontalBar, StackedHorizontalBar } from './StackedHorizontalBar/StackedHorizontalBar.js';
import { Multiline } from './Multiline/multiline.js';

let test = new Multiline;

// Test simple
const container = document.getElementById('chart-container');
if (container)
{
    const calendar = new CalendarDensity
    (
        2023,
        'api/calendar_density/journal_participant/1234',
        container as HTMLElement
    );
    (async () => {
        await calendar.obtain_datas_by_year();
        calendar.render();
    })();
}

const container_anniv = document.getElementById('chart-container-anniv');
if (container_anniv)
{
    const calendar_anniv = new CalendarDensity
    (
        2025,
        'api/calendar_density/anniversaire',
        container_anniv as HTMLElement
    );
    (async () => {
        await calendar_anniv.obtain_datas_by_year();
        calendar_anniv.render();
    })();
}

const container_anniv_part = document.getElementById('anniv-part');
if (container_anniv_part)
{
    const calendar_anniv_part = new CalendarDensity
    (
        2025,
        'api/calendar_density/anniversaires/participants/1',
        container_anniv_part as HTMLElement
    );
    (async () => {
        await calendar_anniv_part.obtain_datas_by_year();
        calendar_anniv_part.render();
    })();
}

const ganttData: DataGantt[] = [
  {
    category: "Planification",
    color: "#8e44ad",
    startdatetime: new Date("2000-07-01T09:00:00"),
    enddatetime: new Date("2025-07-10T17:00:00"),
    label: "Analyse des besoins",
    description: "Collecte et analyse des besoins du projet"
  },
  {
    category: "Planification",
    color: "#9b59b6",
    startdatetime: new Date("2012-07-08T08:30:00"),
    enddatetime: new Date("2025-07-12T16:30:00"),
    label: "Architecture technique",
    description: "Définition de l'architecture du système"
  },
  {
    category: "Design",
    color: "#e67e22",
    startdatetime: new Date("2013-07-11T10:00:00"),
    enddatetime: new Date("2025-07-20T18:00:00"),
    label: "Maquettes",
    description: "Création des maquettes de l'interface utilisateur"
  },
  {
    category: "Développement",
    color: "#3498db",
    startdatetime: new Date("2015-07-15T08:00:00"),
    enddatetime: new Date("2025-07-28T17:30:00"),
    label: "Module Auth",
    description: "Développement du module d'authentification"
  },
  {
    category: "Développement",
    color: "#2980b9",
    startdatetime: new Date("2016-07-22T09:30:00"),
    enddatetime: new Date("2025-08-05T16:00:00"),
    label: "Interface principale",
    description: "Développement de l'interface utilisateur principale"
  },
  {
    category: "Développement",
    color: "#1abc9c",
    startdatetime: new Date("2017-07-25T10:30:00"),
    enddatetime: new Date("2025-08-08T17:00:00"),
    label: "APIs Backend",
    description: "Développement des APIs pour la communication avec le frontend"
  },
  {
    category: "Tests",
    color: "#f39c12",
    startdatetime: new Date("2018-08-01T08:00:00"),
    enddatetime: new Date("2025-08-12T18:30:00"),
    label: "Tests unitaires",
    description: "Vérification des fonctionnalités de base"
  },
  {
    category: "Tests",
    color: "#e74c3c",
    startdatetime: new Date("2019-08-10T09:00:00"),
    enddatetime: new Date("2025-08-18T17:45:00"),
    label: "Tests d'intégration",
    description: "Vérification de l'intégration des modules"
  },
  {
    category: "Déploiement",
    color: "#34495e",
    startdatetime: new Date("2020-08-15T08:30:00"),
    enddatetime: new Date("2025-08-22T19:00:00"),
    label: "Préparation prod",
    description: "Configuration des serveurs et bases de données"
  },
  {
    category: "Déploiement",
    color: "#2c3e50",
    startdatetime: new Date("2023-08-20T06:00:00"),
    enddatetime: new Date("2025-08-25T20:00:00"),
    description: "Mise en production",
    label: "Go Live"
  }
];

const container_gantt = document.getElementById('gantt');
if (container_gantt)
{
    const gantt = new Gantt
    (
        '',
        container_gantt as HTMLElement
    );
    gantt.set_datas(ganttData);
    gantt.render();
}

const container_participant_participations = document.getElementById('participant-inscriptions');
if (container_participant_participations)
{
    const gantt2 = new Gantt
    (
        'api/gantt/participant_inscription?participant_id=156',
        container_participant_participations as HTMLElement
    );
    (async () => {
      await gantt2.obtain_datas();
      gantt2.render();
    })();
}

// Jeu de données : Répartition hommes/femmes dans le secteur technologique (en milliers)
export const techSectorData: DataStackedHorizontalBar[] = [
  {
    label: "France",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique en France",
    value: 420
  },
  {
    label: "France",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique en France",
    value: 280
  },
  {
    label: "Japon",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique au Japon",
    value: 890
  },
  {
    label: "Japon",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique au Japon",
    value: 310
  },
  {
    label: "Maroc",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique au Maroc",
    value: 65
  },
  {
    label: "Maroc",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique au Maroc",
    value: 35
  },
  {
    label: "Liberia",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique au Liberia",
    value: 8
  },
  {
    label: "Liberia",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique au Liberia",
    value: 12
  },
  {
    label: "États-Unis",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique aux États-Unis",
    value: 1850
  },
  {
    label: "États-Unis",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique aux États-Unis",
    value: 1150
  },
  {
    label: "Allemagne",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique en Allemagne",
    value: 580
  },
  {
    label: "Allemagne",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique en Allemagne",
    value: 320
  },
  {
    label: "Inde",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique en Inde",
    value: 2200
  },
  {
    label: "Inde",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique en Inde",
    value: 800
  },
  {
    label: "Brésil",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique au Brésil",
    value: 340
  },
  {
    label: "Brésil",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique au Brésil",
    value: 260
  },
  {
    label: "Corée du Sud",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique en Corée du Sud",
    value: 450
  },
  {
    label: "Corée du Sud",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique en Corée du Sud",
    value: 180
  },
  {
    label: "Canada",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique au Canada",
    value: 280
  },
  {
    label: "Canada",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique au Canada",
    value: 220
  },
  {
    label: "Australie",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique en Australie",
    value: 180
  },
  {
    label: "Australie",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique en Australie",
    value: 140
  },
  {
    label: "Singapour",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique à Singapour",
    value: 85
  },
  {
    label: "Singapour",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique à Singapour",
    value: 75
  },
  {
    label: "Nigéria",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique au Nigéria",
    value: 95
  },
  {
    label: "Nigéria",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique au Nigéria",
    value: 65
  },
  {
    label: "Suède",
    category: "homme",
    color: "#3B82F6",
    description: "Hommes travaillant dans le secteur technologique en Suède",
    value: 120
  },
  {
    label: "Suède",
    category: "femme",
    color: "#EC4899",
    description: "Femmes travaillant dans le secteur technologique en Suède",
    value: 90
  }
];

const container_shb1 = document.getElementById('SHB1');
if (container_shb1)
{
    const shb1 = new StackedHorizontalBar
    (
        '',
        container_shb1 as HTMLElement
    );
    shb1.set_datas(techSectorData);
    shb1.render();
}

const container_shb2 = document.getElementById('SHB2');
if (container_shb2)
{
    const shb2 = new StackedHorizontalBar
    (
        'api/shb/participation_atelier?participant_id=1234',
        container_shb2 as HTMLElement
    );
    (async () => {
      await shb2.obtain_datas();
      shb2.render();
    })();
}

const container_shb3 = document.getElementById('SHB3');
if (container_shb3)
{
    const shb3 = new StackedHorizontalBar
    (
        'api/shb/participation_atelier?participant_id=123',
        container_shb3 as HTMLElement
    );
    (async () => {
      await shb3.obtain_datas();
      shb3.render();
    })();
}

const container_shb4 = document.getElementById('SHB4');
if (container_shb4)
{
    const shb4 = new StackedHorizontalBar
    (
        'api/shb/participation_atelier?participant_id=156',
        container_shb4 as HTMLElement
    );
    (async () => {
      await shb4.obtain_datas();
      shb4.render();
    })();
}