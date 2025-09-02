import { CalendarDensity } from './d3CalendarDensity/CalendarDensity.js';
import { DataGantt, Gantt } from './Gantt/Gantt.js';
import { DataStackedHorizontalBar, StackedHorizontalBar } from './StackedHorizontalBar/StackedHorizontalBar.js';
import { DataMultiline, Multiline } from './Multiline/multiline.js';
import { DataPie, Pie } from './pie/Pie.js';
import { DataHorizontalBar, HorizontalBar } from './HorizontalBar/HorizontalBar.js';
import { DataCalendarMonth, CalendarMonth } from './CalendarMonth/CalendarMonth.js';
import { Dataframe } from './Dataframe/Dataframe.js';


async function envoyerDonnees(url: string, donnees: any): Promise<any> 
{
  try
  {
    const response = await fetch
    (
      url,
      {
        method: 'POST',
        headers:
        {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donnees)
      }
    );

    if (!response.ok)
    {
      throw new Error(`Erreur HTTP! Statut: ${response.status}`);
    }

    return await response.json();
  }
  catch (error)
  {
    console.error('Erreur lors de l\'envoi des données:', error, " à ", url);
    // throw error;
  }
}

const url = 'http://localhost:9000/api/df/summary_commentaires_ateliers';

const donneesAEnvoyer =
{
  message: "Je suis des données envoyées depuis le client par post",
};

(
  async () =>
  {
    const r = await envoyerDonnees(url, donneesAEnvoyer);
    console.log("r = ", r);
  }
)();


export const testData = [
  {
    label: "Farine",
    value: "0.250",
    date: "2025-01-02",
    description: "Farine de blé (250g)"
  },
  {
    label: "Sucre",
    value: "0.100",
    date: "2025-01-03",
    description: "Sucre en poudre (100g)"
  },
  {
    label: "Lait",
    value: "0.300",
    date: "2025-01-06",
    description: "Lait entier (300ml)"
  },
  {
    label: "Levure",
    value: "0.050",
    date: "2025-01-10",
    description: "Levure chimique (1 sachet, 11g)"
  },
  {
    label: "Beurre",
    value: "0.200",
    date: "2025-01-12",
    description: "Beurre doux (200g)"
  },
  {
    label: "Vanille",
    value: "0.030",
    date: "2025-01-14",
    description: "Extrait de vanille (30ml)"
  },
  {
    label: "Oeuf",
    value: "0.600",
    date: "2025-01-16",
    description: "Œufs (3 pièces), Sel fin (1 pincée)"
  },
  {
    label: "Chocolat",
    value: "0.150",
    date: "2025-01-18",
    description: "Chocolat noir pâtissier (150g)"
  },
  {
    label: "Chocolat",
    value: "0.100",
    date: "2025-01-20",
    description: "Pépites de chocolat (100g)"
  }
];


const container_df1 = document.getElementById('df1');
if (container_df1)
{
  const df1 = new Dataframe
  (
    'api/test_dataframe',
    container_df1 as HTMLElement,
    ["date", "description"]
  );

  (async () => {
      await df1.obtain_datas();
      df1.render();
  })();
}

// const container_df_summary = document.getElementById('df_summary');
// if (container_df_summary)
// {
  // const df_summary = new Dataframe
  // (
  //   'api/df/summary_commentaires_ateliers',
  //   container_df_summary as HTMLElement,
  //   ["Index", "Résumé des commentaires"]
  // );

  // (async () => {
  //     await df_summary.obtain_datas();
  //     df_summary.render();
  // })();
// }

const container_df2 = document.getElementById('df2');
if (container_df2)
{
  const df2 = new Dataframe
  (
    'api/test_dataframe',
    container_df2 as HTMLElement,
  );

  (async () => {
    await df2.obtain_datas();
    df2.render();
  })();
}

const container_df3 = document.getElementById('df3');
if (container_df3)
{
  const df3 = new Dataframe
  (
    '',
    container_df3 as HTMLElement,
  );

  df3.set_data(testData);
  df3.render();
  // (async () => {
  //     await cal1.obtain_datas();
  //     cal1.render();
  // })();
}

const container_df4 = document.getElementById('df4');
if (container_df4)
{
  const df4 = new Dataframe
  (
    '',
    container_df4 as HTMLElement,
  );

  df4.set_data(testData);
  df4.render();
  // (async () => {
  //     await cal1.obtain_datas();
  //     cal1.render();
  // })();
}


const calendarData: DataCalendarMonth[] =
[
    {
      b: new Date('2025-07-01T09:00:00'),
      e: new Date('2025-07-01T10:30:00'),
      all_day: false,
      subject: 'Réunion équipe marketing',
      description: 'Point mensuel avec l\'équipe marketing pour faire le bilan des campagnes en cours et planifier les actions du mois prochain.',
      color: '#3498db'
    },
    {
      b: new Date('2025-07-03T00:00:00'),
      e: null,
      all_day: true,
      subject: 'Congés été',
      description: 'Début des congés d\'été. Période de repos bien méritée pour se ressourcer avant la rentrée.',
      color: '#e74c3c'
    },
    {
      b: new Date('2025-07-05T14:00:00'),
      e: new Date('2025-07-05T15:00:00'),
      all_day: false,
      subject: 'Entretien candidat développeur',
      description: 'Entretien technique avec un candidat développeur fullstack pour rejoindre notre équipe de développement.',
      color: '#2ecc71'
    },
    {
      b: new Date('2025-07-08T08:30:00'),
      e: new Date('2025-07-08T12:00:00'),
      all_day: false,
      subject: 'Formation TypeScript',
      description: 'Session de formation intensive sur TypeScript : types avancés, interfaces et bonnes pratiques pour l\'équipe de développement.',
      color: '#f39c12'
    },
    {
      b: new Date('2025-07-10T00:00:00'),
      e: null,
      all_day: true,
      subject: 'Anniversaire Marie',
      description: 'Anniversaire de Marie de l\'équipe comptabilité. Pensez à lui souhaiter et peut-être organiser un petit pot en fin de journée.',
      color: '#9b59b6'
    },
    {
      b: new Date('2025-07-12T16:00:00'),
      e: new Date('2025-07-12T17:30:00'),
      all_day: false,
      subject: 'Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3Présentation projet Q3',
      description: 'Présentation détaillée du projet majeur pour le troisième trimestre devant le comité de direction et les parties prenantes.',
      color: '#1abc9c'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-15T10:00:00'),
      e: null,
      all_day: false,
      subject: 'Appel client sans heure de fin définie',
      description: 'Appel important avec le client pour discuter des spécifications du projet. Durée variable selon les besoins.',
      color: '#34495e'
    },
    {
      b: new Date('2025-07-18T00:00:00'),
      e: new Date('2025-07-20T23:59:59'),
      all_day: true,
      subject: 'Conférence Tech Paris',
      description: 'Participation à la grande conférence technologique parisienne. Trois jours de conférences, workshops et networking avec les professionnels du secteur.',
      color: '#e67e22'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-22T13:00:00'),
      e: new Date('2025-07-22T14:00:00'),
      all_day: false,
      subject: 'Déjeuner d\'affaires',
      description: 'Déjeuner professionnel pour discuter des opportunités de partenariat et renforcer les relations commerciales.',
      color: '#95a5a6'
    },
    {
      b: new Date('2025-07-25T09:15:00'),
      e: new Date('2025-07-25T11:45:00'),
      all_day: false,
      subject: 'Sprint planning',
      description: 'Réunion de planification du prochain sprint avec l\'équipe de développement. Définition des objectifs et répartition des tâches.',
      color: '#3498db'
    }
];

// Test simple
// const container = document.getElementById('chart-container');
// if (container)
// {
//     const calendar = new CalendarDensity
//     (
        
//         'api/calendarMonth/participations/1234?date_begin=2000-01-01&date_end=2045-01-01',
//         container as HTMLElement,
//         2022,
//         6
//     );
//     (async () => {
//         await calendar.obtain_datas_by_year();
//         calendar.render();
//     })();
// }


const container_cal1 = document.getElementById('cal1');
if (container_cal1)
{
  const cal1 = new CalendarMonth
  (
    'api/calendarMonth/participations/2173',
    container_cal1 as HTMLElement,
    2025,
    0
  );

  (async () => {
      await cal1.obtain_datas();
      cal1.render();
  })();
}

const container_cal2 = document.getElementById('cal2');
if (container_cal2)
{
    const cal2 = new CalendarMonth
    (
        'api/calendarMonth/participations/1234',
        container_cal2,
    );

    (async () => {
      await cal2.obtain_datas();
      cal2.render();
    })();
}

const container_cal3 = document.getElementById('cal3');
if (container_cal3) {
    const cal3 = new CalendarMonth(
        '',
        container_cal3,
        2025,
        6
    );
    cal3.set_data(calendarData);

    cal3.render();
}

const container_cal4 = document.getElementById('cal4');
if (container_cal4) {
    const cal4 = new CalendarMonth(
        '',
        container_cal4,
        2025,
        6
    );
    cal4.set_data(calendarData);

    cal4.render();
}

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

const multilineData: DataMultiline[] = [
  // Jannik Sinner
  {
    label: "Jannik Sinner",
    color: "#ff6b35",
    date: new Date("2024-01-01"),
    value: 4,
    description: "Classement ATP Jannik Sinner - Janvier"
  },
  {
    label: "Jannik Sinner",
    color: "#ff6b35",
    date: new Date("2024-03-01"),
    value: 3,
    description: "Classement ATP Jannik Sinner - Mars"
  },
  {
    label: "Jannik Sinner",
    color: "#ff6b35",
    date: new Date("2024-05-01"),
    value: 2,
    description: "Classement ATP Jannik Sinner - Mai"
  },
  {
    label: "Jannik Sinner",
    color: "#ff6b35",
    date: new Date("2024-07-01"),
    value: 1,
    description: "Classement ATP Jannik Sinner - Juillet"
  },
  {
    label: "Jannik Sinner",
    color: "#ff6b35",
    date: new Date("2024-09-01"),
    value: 1,
    description: "Classement ATP Jannik Sinner - Septembre"
  },
  {
    label: "Jannik Sinner",
    color: "#ff6b35",
    date: new Date("2024-11-01"),
    value: 1,
    description: "Classement ATP Jannik Sinner - Novembre"
  },

  // Novak Djokovic
  {
    label: "Novak Djokovic",
    color: "#2e86ab",
    date: new Date("2024-01-01"),
    value: 1,
    description: "Classement ATP Novak Djokovic - Janvier"
  },
  {
    label: "Novak Djokovic",
    color: "#2e86ab",
    date: new Date("2024-03-01"),
    value: 1,
    description: "Classement ATP Novak Djokovic - Mars"
  },
  {
    label: "Novak Djokovic",
    color: "#2e86ab",
    date: new Date("2024-05-01"),
    value: 1,
    description: "Classement ATP Novak Djokovic - Mai"
  },
  {
    label: "Novak Djokovic",
    color: "#2e86ab",
    date: new Date("2024-07-01"),
    value: 2,
    description: "Classement ATP Novak Djokovic - Juillet"
  },
  {
    label: "Novak Djokovic",
    color: "#2e86ab",
    date: new Date("2024-09-01"),
    value: 4,
    description: "Classement ATP Novak Djokovic - Septembre"
  },
  {
    label: "Novak Djokovic",
    color: "#2e86ab",
    date: new Date("2024-11-01"),
    value: 7,
    description: "Classement ATP Novak Djokovic - Novembre"
  },

  // Carlos Alcaraz
  {
    label: "Carlos Alcaraz",
    color: "#a23b72",
    date: new Date("2024-01-01"),
    value: 2,
    description: "Classement ATP Carlos Alcaraz - Janvier"
  },
  {
    label: "Carlos Alcaraz",
    color: "#a23b72",
    date: new Date("2024-03-01"),
    value: 2,
    description: "Classement ATP Carlos Alcaraz - Mars"
  },
  {
    label: "Carlos Alcaraz",
    color: "#a23b72",
    date: new Date("2024-05-01"),
    value: 3,
    description: "Classement ATP Carlos Alcaraz - Mai"
  },
  {
    label: "Carlos Alcaraz",
    color: "#a23b72",
    date: new Date("2024-07-01"),
    value: 3,
    description: "Classement ATP Carlos Alcaraz - Juillet"
  },
  {
    label: "Carlos Alcaraz",
    color: "#a23b72",
    date: new Date("2024-09-01"),
    value: 2,
    description: "Classement ATP Carlos Alcaraz - Septembre"
  },
  {
    label: "Carlos Alcaraz",
    color: "#a23b72",
    date: new Date("2024-11-01"),
    value: 3,
    description: "Classement ATP Carlos Alcaraz - Novembre"
  }
];

const container_multiline1 = document.getElementById('multiline1');
if (container_multiline1)
{
    const multiline1 = new Multiline
    (
        '',
        container_multiline1 as HTMLElement
    );

    multiline1.set_datas(multilineData);
    multiline1.render();
}

const container_multiline2 = document.getElementById('multiline2');
if (container_multiline2)
{
    const multiline2 = new Multiline
    (
        '',
        container_multiline2 as HTMLElement
    );

    multiline2.set_datas(multilineData);
    multiline2.render();
}

const container_multiline3 = document.getElementById('multiline3');
if (container_multiline3)
{
    const multiline3 = new Multiline
    (
        '',
        container_multiline3 as HTMLElement
    );

    multiline3.set_datas(multilineData);
    multiline3.render();
}

const container_multiline4 = document.getElementById('multiline4');
if (container_multiline4)
{
    const multiline4 = new Multiline
    (
        '',
        container_multiline4 as HTMLElement
    );

    multiline4.set_datas(multilineData);
    multiline4.render();
}

const container_multiline5 = document.getElementById('multiline5');
if (container_multiline5)
{
    const multiline5 = new Multiline
    (
        'api/multiline/score_participant/1234',
        container_multiline5 as HTMLElement
    );

    (async () => {
        await multiline5.obtain_datas();
        multiline5.render();
    })();

}

const container_multiline6 = document.getElementById('multiline6');
if (container_multiline6)
{
    const multiline6 = new Multiline
    (
        'api/multiline/score_participant/1973',
        container_multiline6 as HTMLElement
    );
    (async () => {
        await multiline6.obtain_datas();
        multiline6.render();
    })();
}

const container_multiline7 = document.getElementById('multiline7');
if (container_multiline7)
{
    const multiline7 = new Multiline
    (
        'api/multiline/score_participant/1964',
        container_multiline7 as HTMLElement
    );

    (async () => {
        await multiline7.obtain_datas();
        multiline7.render();
    })();

}

const container_multiline8 = document.getElementById('multiline8');
if (container_multiline8)
{
    const multiline8 = new Multiline
    (
        'api/multiline/score_participant/1101',
        container_multiline8 as HTMLElement
    );

    (async () => {
        await multiline8.obtain_datas();
        multiline8.render();
    })();

}

const tarteAuxPommesData: DataPie[] = [
  {
    label: "Pommes",
    color: "#FF6B6B",
    value: 800,
    description: "Pommes Golden délicieuses, pelées et coupées en lamelles"
  },
  {
    label: "Farine",
    color: "#F7DC6F",
    value: 250,
    description: "Farine de blé T55 pour la pâte brisée"
  },
  {
    label: "Beurre",
    color: "#FFD93D",
    value: 125,
    description: "Beurre doux pour la pâte et le crumble"
  },
  {
    label: "Sucre",
    color: "#A8E6CF",
    value: 100,
    description: "Sucre blanc cristallisé pour sucrer les pommes"
  },
  {
    label: "Œufs",
    color: "#FFB347",
    value: 60,
    description: "Œufs frais pour lier la pâte"
  },
  {
    label: "Cannelle",
    color: "#D2691E",
    value: 5,
    description: "Cannelle en poudre pour parfumer"
  },
  {
    label: "Sel",
    color: "#E6E6FA",
    value: 3,
    description: "Pincée de sel fin pour rehausser les saveurs"
  }
];
// Exemple d'utilisation alternative avec une pizza margherita
const pizzaMargheritaData: DataPie[] = [
  {
    label: "Pâte à pizza",
    color: "#F4A460",
    value: 300,
    description: "Pâte à pizza fraîche faite maison"
  },
  {
    label: "Sauce tomate",
    color: "#FF4500",
    value: 150,
    description: "Sauce tomate italienne aux herbes"
  },
  {
    label: "Mozzarella",
    color: "#FFFAF0",
    value: 200,
    description: "Mozzarella di bufala fraîche"
  },
  {
    label: "Basilic",
    color: "#228B22",
    value: 10,
    description: "Feuilles de basilic frais"
  },
  {
    label: "Huile d'olive",
    color: "#9ACD32",
    value: 15,
    description: "Huile d'olive extra vierge"
  },
  {
    label: "Sel & Poivre",
    color: "#696969",
    value: 2,
    description: "Assaisonnement sel et poivre"
  }
];
// Exemple avec les macronutriments d'un repas équilibré
const macronutrimentsData: DataPie[] = [
  {
    label: "Glucides",
    color: "#4ECDC4",
    value: 45,
    description: "45% des calories totales - Riz, pâtes, légumes"
  },
  {
    label: "Protéines",
    color: "#45B7D1",
    value: 25,
    description: "25% des calories totales - Viande, poisson, légumineuses"
  },
  {
    label: "Lipides",
    color: "#F39C12",
    value: 30,
    description: "30% des calories totales - Huiles, noix, avocat"
  }
];

const container_pie1 = document.getElementById('pie1');
if (container_pie1)
{
    const pie1 = new Pie
    (
        '',
        container_pie1 as HTMLElement
    );
    pie1.set_datas(tarteAuxPommesData);
    pie1.render();
}

const container_pie3 = document.getElementById('pie3');
if (container_pie3)
{
    const pie3 = new Pie
    (
        '',
        container_pie3 as HTMLElement
    );
    pie3.set_datas(pizzaMargheritaData);
    pie3.render();
}

const container_pie2 = document.getElementById('pie2');
if (container_pie2)
{
    const pie2 = new Pie
    (
        'api/pie/presence_participant/1973',
        container_pie2 as HTMLElement
    );
    (async () => {
        await pie2.obtain_datas();
        pie2.render();
    })();

}

const container_pie4 = document.getElementById('pie4');
if (container_pie4) 
{
    const pie4 = new Pie
    (
        'api/pie/presence_participant/1234',
        container_pie4 as HTMLElement
    );

    (async () => {
        await pie4.obtain_datas();
        pie4.render();
    })();

}

// Ventes de voitures par marque en France (2024) - en milliers d'unités
export const carSalesData: DataHorizontalBar[] = [
  {
    label: "Peugeot",
    value: 285,
    color: "#1E40AF",
    description: "Leader français avec une forte présence sur les segments populaires"
  },
  {
    label: "Renault",
    value: 268,
    color: "#DC2626",
    description: "Marque historique française, spécialiste des citadines et SUV"
  },
  {
    label: "Citroën",
    value: 195,
    color: "#7C2D12",
    description: "Marque française axée sur le confort et l'innovation"
  },
  {
    label: "Volkswagen",
    value: 142,
    color: "#059669",
    description: "Constructeur allemand premium avec une gamme diversifiée"
  },
  {
    label: "Toyota",
    value: 128,
    color: "#B91C1C",
    description: "Leader japonais de l'hybride et de la fiabilité"
  },
  {
    label: "Dacia",
    value: 115,
    color: "#6B7280",
    description: "Marque low-cost du groupe Renault, très populaire"
  },
  {
    label: "BMW",
    value: 98,
    color: "#1F2937",
    description: "Constructeur allemand premium et sportif"
  },
  {
    label: "Mercedes-Benz",
    value: 87,
    color: "#374151",
    description: "Marque de luxe allemande, symbole de prestige"
  },
  {
    label: "Audi",
    value: 76,
    color: "#4B5563",
    description: "Constructeur allemand premium, design moderne"
  },
  {
    label: "Ford",
    value: 65,
    color: "#1E3A8A",
    description: "Constructeur américain présent sur tous les segments"
  }
];

// Alternative : Ingrédients pour une recette de ratatouille (en grammes)
export const ratatouilleIngredients: DataHorizontalBar[] = [
  {
    label: "Aubergines",
    value: 400,
    color: "#7C3AED",
    description: "Légume principal, coupé en dés"
  },
  {
    label: "Courgettes",
    value: 350,
    color: "#10B981",
    description: "Fraîches et fermes, en rondelles"
  },
  {
    label: "Tomates",
    value: 500,
    color: "#EF4444",
    description: "Bien mûres, pelées et concassées"
  },
  {
    label: "Poivrons",
    value: 300,
    color: "#F59E0B",
    description: "Mélange de poivrons rouges et verts"
  },
  {
    label: "Oignons",
    value: 200,
    color: "#8B5CF6",
    description: "Émincés finement pour la base"
  },
  {
    label: "Ail",
    value: 15,
    color: "#F3F4F6",
    description: "Gousses écrasées pour l'arôme"
  },
  {
    label: "Huile d'olive",
    value: 60,
    color: "#84CC16",
    description: "Extra vierge, première pression"
  },
  {
    label: "Herbes de Provence",
    value: 5,
    color: "#22C55E",
    description: "Thym, romarin, basilic séchés"
  }
];


const container_bh1 = document.getElementById('bh1');
if (container_bh1)
{
    const bh1 = new HorizontalBar
    (
        '',
        container_bh1 as HTMLElement
    );
    bh1.set_datas(carSalesData);
    bh1.render();
}

const container_bh2 = document.getElementById('bh2');
if (container_bh2)
{
    const bh2 = new HorizontalBar
    (
        '',
        container_bh2 as HTMLElement
    );
    bh2.set_datas(ratatouilleIngredients);
    bh2.render();
}

const container_bh3 = document.getElementById('bh3');
if (container_bh3)
{
    const bh3 = new HorizontalBar
    (
        '',
        container_bh3 as HTMLElement
    );

    bh3.set_datas(carSalesData);
    bh3.render();
}

const container_bh4 = document.getElementById('bh4');
if (container_bh4)
{
    const bh4 = new HorizontalBar
    (
        '',
        container_bh4 as HTMLElement
    );
    bh4.set_datas(ratatouilleIngredients);
    bh4.render();
}



const container_hb5 = document.getElementById('hb5');
if (container_hb5) 
{
    const hb5 = new HorizontalBar
    (
        'api/pie/presence_participant/1234',
        container_hb5 as HTMLElement
    );
    (async () => {
        await hb5.obtain_datas();
        hb5.render();
    })();
}

const container_hb6 = document.getElementById('hb6');
if (container_hb6) 
{
    const hb6 = new HorizontalBar
    (
        'api/hb/excuses_participant/1234',
        container_hb6 as HTMLElement
    );

    (async () => {
        await hb6.obtain_datas();
        hb6.render();
    })();

}

const container_hb7 = document.getElementById('hb7');
if (container_hb7) 
{
    const hb7 = new HorizontalBar
    (
        'api/hb/excuses_participant/1234',
        container_hb7 as HTMLElement
    );
    (async () => {
        await hb7.obtain_datas();
        hb7.render();
    })();
}

const container_hb8 = document.getElementById('hb8');
if (container_hb8) 
{
    const hb8 = new HorizontalBar
    (
        'api/pie/presence_participant/2173',
        container_hb8 as HTMLElement
    );
    (async () => {
        await hb8.obtain_datas();
        hb8.render();
    })();
}