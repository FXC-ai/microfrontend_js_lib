/**
 * DIAGRAMME DE GANTT - Classe de visualisation interactive
 * 
 * Vue d'ensemble:
 * - Composant de visualisation de données temporelles sous forme de diagramme de Gantt
 * - Hérite de UIElement et utilise D3.js pour le rendu graphique
 * - Support complet de l'interactivité (zoom, pan, tooltips)
 * - Localisation française intégrée
 * - Responsive et adaptatif
 * 
 * Fonctionnalités principales:
 * - Visualisation temporelle avec dates de début et fin
 * - Zoom et pan interactifs (0.5x à 20x)
 * - Tooltips informatifs au clic
 * - Catégorisation avec couleurs personnalisées
 * - Gestion automatique des dimensions
 * 
 * Format des données attendu:
 * {
 *   label: "Nom de la tâche",           // Requis
 *   color: "#FF5733",                  // Optionnel, défaut: "#666"
 *   category: "Catégorie",             // Optionnel, défaut: "Général"
 *   startdatetime: "2024-01-01T10:00:00", // Requis (ISO 8601)
 *   enddatetime: "2024-01-15T18:00:00",   // Requis (ISO 8601)
 *   description: "Description"         // Optionnel
 * }
 * 
 * Exemple d'utilisation:
 * const gantt = new Gantt('api/gantt-data', document.getElementById('container'));
 * await gantt.obtain_datas();
 * gantt.render();
 * 
 * Dépendances:
 * - D3.js (visualisation)
 * - UIElement (classe parente)
 * - d3-time-format (localisation)
 */

import * as d3 from 'd3';
import { timeFormatDefaultLocale } from "d3-time-format";
import { UIElement } from '../UIElement.js';

/**
 * Configuration de la locale française pour les dates
 * Permet l'affichage des dates, jours et mois en français
 */
timeFormatDefaultLocale({
  dateTime: "%A %e %B %Y à %X",
  date: "%d/%m/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  shortDays: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  months: [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ],
  shortMonths: [
    "janv.", "févr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc."
  ]
});

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Retourne un tableau de valeurs uniques à partir d'un tableau d'entrée
 * Utilise un hashMap pour optimiser les performances
 * @param {Array} array - Tableau d'entrée
 * @returns {Array} Tableau de valeurs uniques
 */
function getUniqueValues(array) {
  const hashMap = {};
  const result = [];
  
  for (let i = 0, length = array.length; i < length; ++i) {
    if (!hashMap.hasOwnProperty(array[i])) {
      hashMap[array[i]] = true;
      result.push(array[i]);
    }
  }
  return result;
}

/**
 * Crée un élément tooltip réutilisable
 * Style de base appliqué avec positionnement absolu
 * @returns {d3.Selection} Élément tooltip D3
 */
function createTooltip() {
  return d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px");
}

/**
 * Génère le contenu HTML formaté pour les tooltips
 * @param {string} label - Libellé de la tâche
 * @param {string} color - Couleur de la barre
 * @param {string} category - Catégorie de la tâche
 * @param {Date} startDateTime - Date de début
 * @param {Date} endDateTime - Date de fin
 * @param {string} description - Description optionnelle
 * @returns {string} HTML formaté pour le tooltip
 */
function generateTooltipContent(label, color, category, startDateTime, endDateTime, description) {
  return `
    <div class="gantt-tooltip">
      <div style="border-bottom: 2px solid ${color}"; class="gantt-tooltip__header">
        <h3 style="color:${color};">${label}</h3>
      </div>
      <div class="gantt-tooltip__content">
        <div>
          <span>Catégorie:</span>
          <span>${category}</span>
        </div>
        <div>
          <span>Début:</span>
          <span>${new Date(startDateTime).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        <div>
          <span>Fin:</span>
          <span>${new Date(endDateTime).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        ${description ? `
          <div class="gantt-tooltip__description">
            <span>Description:</span>
            <p>${description}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * CLASSE GANTT - Composant de diagramme de Gantt interactif
 * 
 * Hérite de UIElement pour la gestion de base des composants UI
 * Utilise D3.js pour la visualisation et les interactions
 * 
 * Interface TypeScript pour les données:
 * export interface DataGantt {
 *   label: string;           // Nom de la tâche affiché sur l'axe Y
 *   category: string;        // Catégorie pour le groupement
 *   color: string;           // Couleur de la barre (format hex ou nom)
 *   description: string;     // Description détaillée pour le tooltip
 *   startdatetime: Date;     // Date/heure de début de la tâche
 *   enddatetime: Date;       // Date/heure de fin de la tâche
 * }
 * 
 * Propriétés publiques:
 * - datas: Array<DataGantt>  // Tableau des données de tâches
 * - prefixeAPI: string       // Préfixe pour l'URL de l'API
 */
export class Gantt extends UIElement {
  /**
   * Constructeur de la classe Gantt
   * 
   * @param {string} prefixeAPI - Préfixe pour l'URL de l'API de récupération des données
   *                              Exemple: 'api/gantt' donnera l'URL '/api/gantt'
   * @param {HTMLElement} parent - Élément DOM parent qui contiendra le diagramme
   *                               Doit avoir des dimensions définies
   */
  constructor(prefixeAPI, parent) {
      super(prefixeAPI, parent);
      this.datas = [];
      this.isLoading = false;
      
      /**
       * Configuration par défaut du diagramme
       * Toutes les valeurs sont en pixels sauf indication contraire
       */
      this.DEFAULT_CONFIG = {
          DIV_HEIGHT_AXE_X: 30,      // Hauteur de l'axe X
          BAR_HEIGHT: 24,            // Hauteur des barres de tâches
          ROW_GAP: 30,               // Espacement vertical entre les lignes
          LABEL_WIDTH: 200,          // Largeur de la zone des libellés
          MARGIN_RIGHT: 20,          // Marge droite pour éviter la coupure
          X_AXIS_HEIGHT: 30,         // Hauteur de l'axe temporel
          MIN_WIDTH: 400,            // Largeur minimale requise
          MIN_HEIGHT: 200            // Hauteur minimale requise
      };
  }

  /**
   * MÉTHODE PUBLIQUE - Récupération des données depuis l'API
   * 
   * Fait un appel HTTP GET vers l'API configurée
   * Transforme automatiquement les données reçues
   * Protection contre les appels multiples simultanés
   * Gestion d'erreurs avec fallback sur tableau vide
   * 
   * URL construite: `/${this.prefixeAPI}`
   * Format attendu de la réponse: JSON Array<DataGantt>
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur HTTP ou de parsing JSON
   */
  async obtain_datas() {
      // Protection contre les appels multiples
      if (this.isLoading) {
          return;
      }
      this.isLoading = true;
      try {
          const url = `/${this.prefixeAPI}`;
          const response = await fetch(url);
          if (!response.ok) {
              throw new Error(`Erreur HTTP: ${response.status}`);
          }
          const rawData = await response.json();
          this.datas = this._transformRawData(rawData);
      } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
          this.datas = []; // Assurer un état cohérent
      } finally {
          this.isLoading = false;
      }
  }

  /**
   * MÉTHODE PRIVÉE - Calcul des dimensions du diagramme
   * 
   * Analyse les données pour déterminer les dimensions optimales
   * Prend en compte les dimensions du conteneur parent
   * 
   * @private
   * @returns {Object} Objet contenant les dimensions calculées
   * @returns {Map} labelGroups - Groupement des données par libellé
   * @returns {number} totalSvgHeight - Hauteur totale calculée
   * @returns {number} containerWidth - Largeur du conteneur
   * @returns {number} containerHeight - Hauteur du conteneur
   */
  _calculateDimensions() {
      const labelGroups = d3.group(this.datas, (d) => d["label"]);
      const totalSvgHeight = labelGroups.size * this.DEFAULT_CONFIG.ROW_GAP;
      const containerWidth = this.parent.clientWidth;

      let containerHeight;
      if (this.parent.clientHeight == 0)
      {
          containerHeight = totalSvgHeight > 768 ? 768 : totalSvgHeight + this.DEFAULT_CONFIG.X_AXIS_HEIGHT;
      }
      else
      {
          containerHeight = this.parent.clientHeight;
      }
      
      
      return { labelGroups, totalSvgHeight, containerWidth, containerHeight };
  }

  /**
   * MÉTHODE PRIVÉE - Vérification des dimensions minimales
   * 
   * Vérifie que les dimensions respectent les minimums requis
   * Affiche un avertissement si les dimensions sont insuffisantes
   * 
   * @private
   * @param {number} containerWidth - Largeur du conteneur
   * @param {number} containerHeight - Hauteur du conteneur
   * @returns {boolean} True si les dimensions sont suffisantes
   */
  _checkMinimumDimensions(containerWidth, containerHeight) {
      if (containerWidth < this.DEFAULT_CONFIG.MIN_WIDTH || containerHeight < this.DEFAULT_CONFIG.MIN_HEIGHT)
      {
          console.warn("Gantt chart dimensions are below minimum requirements.");
          return false;
      }
      return true;
  }

  /**
   * MÉTHODE PRIVÉE - Création de la structure DOM
   * 
   * Crée la structure HTML nécessaire avec:
   * - Conteneur principal (position relative)
   * - Conteneur pour l'axe X (fixe en haut)
   * - Conteneur pour les données (scrollable verticalement)
   * 
   * @private
   * @param {number} containerWidth - Largeur du conteneur
   * @param {number} containerHeight - Hauteur du conteneur
   * @returns {Object} Objets DOM créés
   */
  _createContainers(containerWidth, containerHeight) {
      const mainContainer = d3.create("div")
          .attr("class", "gantt-main-container")
          .style("height", containerHeight + "px")
          .style("width", containerWidth + "px")
          .style("position", "relative");

      const xAxisContainer = d3.create("div")
          .attr("class", "gantt-x-axis-container")
          .style("height", this.DEFAULT_CONFIG.X_AXIS_HEIGHT + "px")
          .style("width", containerWidth + "px");

      const dataContainer = d3.create("div")
          .attr("class", "gantt-data-container")
          .style("height", containerHeight - this.DEFAULT_CONFIG.X_AXIS_HEIGHT + "px")
          .style("width", containerWidth + "px")
          .style("overflow-y", "scroll");

      this.parent.appendChild(mainContainer.node());
      mainContainer.node().appendChild(xAxisContainer.node());
      mainContainer.node().appendChild(dataContainer.node());

      return { mainContainer, xAxisContainer, dataContainer };
  }

  /**
   * MÉTHODE PRIVÉE - Création de l'échelle temporelle
   * 
   * Génère l'échelle temporelle D3 basée sur les dates min/max des données
   * Utilise d3.scaleTime pour une échelle continue
   * Prend en compte la marge droite pour éviter la coupure
   * 
   * @private
   * @param {number} containerWidth - Largeur du conteneur
   * @returns {d3.ScaleTime} Échelle temporelle D3
   */
  _createTimeScale(containerWidth)
  {
      const minDate = d3.min(this.datas, d => d3.isoParse(d.startdatetime));
      const maxDate = d3.max(this.datas, d => d3.isoParse(d.enddatetime));


      return d3.scaleTime()
                .domain([minDate, maxDate])
                .range([0, containerWidth - this.DEFAULT_CONFIG.LABEL_WIDTH - this.DEFAULT_CONFIG.MARGIN_RIGHT]);
  }

  /**
   * MÉTHODE PRIVÉE - Création de l'axe temporel horizontal
   * 
   * Crée l'axe X avec les graduations temporelles
   * Utilise d3.axisTop pour un axe en haut du diagramme
   * Positionnement aligné avec la zone des données
   * 
   * @private
   * @param {d3.Selection} xAxisContainer - Conteneur de l'axe X
   * @param {number} containerWidth - Largeur du conteneur
   * @param {d3.ScaleTime} timeScale - Échelle temporelle
   * @returns {Object} Éléments SVG de l'axe X
   */
  _createXAxis(xAxisContainer, containerWidth, timeScale) {
      const xAxisSvg = xAxisContainer.append("svg")
        .attr("width", containerWidth)
        .attr("height", this.DEFAULT_CONFIG.X_AXIS_HEIGHT);

      const xAxis = xAxisSvg.append("g")
        .attr("transform", `translate(${this.DEFAULT_CONFIG.LABEL_WIDTH},20)`)
        .call(d3.axisTop(timeScale));

      return { xAxisSvg, xAxis };
  }

  /**
   * MÉTHODE PRIVÉE - Création de l'axe des libellés vertical
   * 
   * Crée l'axe Y avec les noms des tâches
   * Utilise d3.axisLeft avec une échelle en bandes
   * Largeur fixe définie par LABEL_WIDTH
   * 
   * @private
   * @param {d3.Selection} dataContainer - Conteneur des données
   * @param {number} totalSvgHeight - Hauteur totale du SVG
   * @returns {d3.Selection} Élément SVG de l'axe des libellés
   */
  _createLabelAxis(dataContainer, totalSvgHeight) {
      const labelSvg = dataContainer.append("svg")
        .attr("height", totalSvgHeight + "px")
        .attr("width", this.DEFAULT_CONFIG.LABEL_WIDTH + "px");

      labelSvg.append("g")
        .attr("transform", `translate(${this.DEFAULT_CONFIG.LABEL_WIDTH},0)`)
        .call(d3.axisLeft(d3.scaleBand()
          .domain(d3.map(this.datas, d => d.label))
          .rangeRound([0, totalSvgHeight]))
          .tickSizeOuter(0));

      return labelSvg;
  }

  /**
   * MÉTHODE PRIVÉE - Création du SVG principal
   * 
   * Crée l'élément SVG qui contiendra les barres de Gantt
   * Dimensionné pour s'adapter au conteneur moins la largeur des libellés et la marge
   * 
   * @private
   * @param {d3.Selection} dataContainer - Conteneur des données
   * @param {number} containerWidth - Largeur du conteneur
   * @param {number} totalSvgHeight - Hauteur totale du SVG
   * @returns {d3.Selection} Élément SVG principal
   */
  _createMainSvg(dataContainer, containerWidth, totalSvgHeight) {
      return dataContainer.append("svg")
        .attr("height", totalSvgHeight + "px")
        .attr("width", (containerWidth - this.DEFAULT_CONFIG.LABEL_WIDTH - this.DEFAULT_CONFIG.MARGIN_RIGHT) + "px");
  }

  /**
   * MÉTHODE PRIVÉE - Création des lignes de grille
   * 
   * Génère les lignes de grille verticales pour faciliter la lecture
   * Utilise les graduations de l'échelle temporelle
   * Classe CSS 'gantt-grid-lines' pour le styling
   * 
   * @private
   * @param {d3.Selection} mainSvg - SVG principal
   * @param {d3.ScaleTime} timeScale - Échelle temporelle
   * @param {number} totalSvgHeight - Hauteur totale du SVG
   * @returns {d3.Selection} Éléments des lignes de grille
   */
  _createGridLines(mainSvg, timeScale, totalSvgHeight) {
      return mainSvg.append("g")
          .attr('class', 'gantt-grid-lines')
          .selectAll("line")
          .data(timeScale.ticks())
          .join("line")
          .attr("x1", d => timeScale(d) + 0.5)
          .attr("x2", d => timeScale(d) + 0.5)
          .attr("y1", 0)
          .attr("y2", totalSvgHeight);
  }

  /**
   * MÉTHODE PRIVÉE - Création des barres de Gantt
   * 
   * Crée les rectangles représentant les tâches
   * Positionnement et dimensionnement basés sur l'échelle temporelle
   * Coins arrondis (rx=5, ry=5) pour l'esthétique
   * Gestion des valeurs NaN pour la robustesse
   * 
   * @private
   * @param {d3.Selection} mainSvg - SVG principal
   * @param {d3.ScaleTime} timeScale - Échelle temporelle
   * @param {number} totalSvgHeight - Hauteur totale du SVG
   * @returns {d3.Selection} Éléments des barres de Gantt
   */
  _createGanttBars(mainSvg, timeScale, totalSvgHeight) {
      return mainSvg.append("g")
        .selectAll("rect")
        .data(this.datas)
        .join("rect")
        .attr('class', 'gantt-bars')
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("x", d => {
            const xPos = timeScale(d.startdatetime);
            return isNaN(xPos) ? 0 : xPos;
        })
        .attr("y", d => d3.scaleBand().domain(d3.map(this.datas, d => d.label)).rangeRound([0, totalSvgHeight])(d.label))
        .attr("width", d => {
            const width = timeScale(d.enddatetime) - timeScale(d.startdatetime);
            return isNaN(width) ? 0 : width;
        })
        .attr("height", this.DEFAULT_CONFIG.BAR_HEIGHT + "px")
        .attr("fill", d => d.color || "#666");
  }

  /**
   * MÉTHODE PRIVÉE - Configuration du zoom et pan
   * 
   * Met en place le comportement de zoom et pan interactif
   * Limites de zoom: 0.5x à 20x (défini par scaleExtent)
   * Mise à jour en temps réel de l'axe X et des barres
   * Gestion des transformations D3 avec rescaleX
   * 
   * @private
   * @param {d3.Selection} mainSvg - SVG principal
   * @param {number} containerWidth - Largeur du conteneur
   * @param {number} totalSvgHeight - Hauteur totale du SVG
   * @param {d3.ScaleTime} timeScale - Échelle temporelle de base
   * @param {d3.Selection} xAxis - Axe X à mettre à jour
   * @param {d3.Selection} ganttBars - Barres de Gantt à mettre à jour
   */
  _setupZoom(mainSvg, containerWidth, totalSvgHeight, timeScale, xAxis, ganttBars) {
      let currentTransform = d3.zoomIdentity;
      let zoomApplied = false;
      const zoomExtent = [[0, 0], [containerWidth - this.DEFAULT_CONFIG.LABEL_WIDTH, totalSvgHeight]];
      const zoomBehavior = d3.zoom()
          .scaleExtent([0.5, 20])
          .extent(zoomExtent)
          .on("zoom", handleZoom);
      mainSvg.call(zoomBehavior);
      
      function handleZoom(event) {
          zoomApplied = true;
          currentTransform = event.transform;
          const newTimeScale = event.transform.rescaleX(timeScale);
          updateChart(newTimeScale);
      }
      
      function updateChart(scale) {
          // Mise à jour de l'axe X
          xAxis.call(d3.axisTop(scale));

          // Mise à jour des barres
          ganttBars
              .attr("x", d => {
                  const xPos = scale(d.startdatetime);
                  return isNaN(xPos) ? 0 : xPos;
              })
              .attr("width", d => {
                  const width = scale(d.enddatetime) - scale(d.startdatetime);
                  return isNaN(width) ? 0 : width;
              });
      }
  }

  /**
   * MÉTHODE PRIVÉE - Configuration des interactions utilisateur
   * 
   * Met en place:
   * - Effets de survol (bordure noire, curseur pointeur)
   * - Tooltips au clic avec informations détaillées
   * - Gestion de la visibilité des tooltips
   * - Positionnement dynamique des tooltips près du curseur
   * 
   * @private
   * @param {d3.Selection} ganttBars - Barres de Gantt
   */
  _setupInteractions(ganttBars) {
      // Gestion des interactions - survol
      ganttBars.style("cursor", "pointer")
          .on("mouseover", function(e, d) {
              d3.select(this)
                  .attr("stroke", "#000000")
                  .attr("stroke-width", 2);
          })
          .on("mouseout", function() {
              d3.select(this)
                  .attr("stroke", null)
                  .attr("stroke-width", null);
              
              tooltip.style("visibility", "hidden");
          });

      // Gestion des interactions - clic et tooltip
      let tooltipVisible = false;
      const tooltip = createTooltip();
      ganttBars.on("click", function(event, d) {
          event.stopPropagation();
          tooltip.style("visibility", "visible")
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY + 10) + "px");
          tooltip.html(generateTooltipContent(
              d.label, 
              d.color, 
              d.category, 
              d.startdatetime, 
              d.enddatetime, 
              d.description
          ));
          tooltipVisible = true;
      });

  }

  /**
   * MÉTHODE PUBLIQUE - Rendu du diagramme
   * 
   * Méthode principale qui orchestre la création complète du diagramme:
   * 1. Calcul des dimensions basé sur les données
   * 2. Vérification des prérequis (dimensions minimales)
   * 3. Création de la structure DOM (conteneurs)
   * 4. Création des échelles et axes temporels
   * 5. Rendu des éléments graphiques (grille, barres)
   * 6. Configuration des interactions (zoom, tooltips)
   * 
   * Prérequis: this.datas doit être rempli (via obtain_datas() ou set_datas())
   * 
   * @public
   */
  render()
  {
      const { labelGroups, totalSvgHeight, containerWidth, containerHeight } = this._calculateDimensions();
      
      if (!this._checkMinimumDimensions(containerWidth, containerHeight)) {
          return;
      }

      const { mainContainer, xAxisContainer, dataContainer } = this._createContainers(containerWidth, containerHeight);
      const timeScale = this._createTimeScale(containerWidth);
      const { xAxisSvg, xAxis } = this._createXAxis(xAxisContainer, containerWidth, timeScale);
      const labelSvg = this._createLabelAxis(dataContainer, totalSvgHeight);
      const mainSvg = this._createMainSvg(dataContainer, containerWidth, totalSvgHeight);
      const gridLines = this._createGridLines(mainSvg, timeScale, totalSvgHeight);
      const ganttBars = this._createGanttBars(mainSvg, timeScale, totalSvgHeight);
      
      this._setupZoom(mainSvg, containerWidth, totalSvgHeight, timeScale, xAxis, ganttBars);
      this._setupInteractions(ganttBars);
  }

  /**
   * MÉTHODE PUBLIQUE - Nettoyage du composant
   * 
   * Supprime tous les éléments DOM créés par le composant
   * Libère la mémoire et évite les fuites lors de la destruction
   * Remet le conteneur parent à l'état initial
   * 
   * @public
   */
  destroy() {
      // Nettoyage du DOM si nécessaire
      if (this.parent) {
          this.parent.innerHTML = '';
      }
  }

  /**
   * MÉTHODE PUBLIQUE - Définition manuelle des données
   * 
   * Permet de définir les données sans passer par l'API
   * Utile pour les tests, données statiques ou alimentation manuelle
   * Les données doivent respecter l'interface DataGantt
   * 
   * @public
   * @param {Array<DataGantt>} datas - Tableau d'objets de données
   */
  set_datas(datas) {
      this.datas = datas;
  }

  /**
   * MÉTHODE PUBLIQUE - Modification du préfixe API
   * 
   * Change le préfixe utilisé pour construire l'URL de l'API
   * Utile pour pointer vers différents endpoints selon le contexte
   * 
   * @public
   * @param {string} prefixeAPI - Nouveau préfixe API
   */
  set_prefixe(prefixeAPI) {
      this.prefixeAPI = prefixeAPI;
  }

  /**
   * MÉTHODE PRIVÉE - Transformation des données brutes
   * 
   * Convertit les données brutes de l'API en format interne
   * Validation de base et application de valeurs par défaut
   * Conversion des chaînes de dates en objets Date
   * Gestion robuste des données manquantes ou invalides
   * 
   * @private
   * @param {Array} rawData - Données brutes depuis l'API
   * @returns {Array<DataGantt>} Données transformées et validées
   */
  _transformRawData(rawData)
  {
      if (!Array.isArray(rawData)) {
          console.error("Données brutes invalides, attendu un tableau.");
          return [];
      }

      return rawData.map
      (
        item => 
        (
          {
            label: item.label || "Sans titre",
            color: item.color || "#666",
            category: item.category || "Général",
            startdatetime: new Date(item.startdatetime),
            enddatetime: new Date(item.enddatetime),
            description: item.description || ""
          }
        )
      );
  }
}