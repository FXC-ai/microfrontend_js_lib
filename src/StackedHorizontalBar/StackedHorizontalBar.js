import * as d3 from 'd3';
import { UIElement } from '../UIElement.js';

/**
 * Crée une tooltip pour afficher les détails au survol
 * @returns {d3.Selection} - Element tooltip D3 attaché au body
 */
function createTooltip() {
    return d3.select("body")
        .append("div")
        .attr("class", "shb-tooltip");
}

/**
 * Classe pour créer un graphique en barres horizontales empilées
 * 
 * @example
 * // Utilisation basique
 * const chart = new StackedHorizontalBar('api/endpoint', containerElement);
 * await chart.obtain_datas();
 * chart.render();
 * 
 * @example
 * // Utilisation avec données personnalisées
 * const chart = new StackedHorizontalBar('api/endpoint', containerElement);
 * chart.set_datas([
 *   { label: 'France', category: 'Ventes', value: 100, color: '#ff0000' },
 *   { label: 'France', category: 'Marketing', value: 50, color: '#00ff00' }
 * ]);
 * chart.render();
 */
export class StackedHorizontalBar extends UIElement
{
    /**
     * Constructeur de la classe StackedHorizontalBar
     * 
     * @param {string} prefixeAPI - Préfixe de l'URL API pour récupérer les données
     * @param {HTMLElement} parent - Élément DOM parent où sera inséré le graphique
     */
    constructor (prefixeAPI, parent)
    {   
        super(prefixeAPI, parent);
        
        /** @type {Array<Object>} Données du graphique */
        this.datas = [];
        
        /** @type {boolean} Indicateur de chargement pour éviter les appels multiples */
        this.isLoading = false;

        /** @type {Object} Configuration par défaut du graphique */
        this.DEFAULT_CONFIG =  {
            marginTop: 0,           // Marge supérieure
            marginRight: 20,        // Marge droite
            marginBottom: 0,        // Marge inférieure
            LABEL_WIDTH: 200,       // Largeur réservée aux labels
            barHeight: 30,          // Hauteur de chaque barre
            axisXHeight: 30         // Hauteur de l'axe X
        };

        console.log("StackedHorizontalBar constructor called");
    }

    /**
     * Récupère les données depuis l'API
     * Protection contre les appels multiples via le flag isLoading
     * 
     * @async
     * @returns {Promise<void>}
     * @throws {Error} Si la requête API échoue
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
     * Définit manuellement les données du graphique
     * 
     * @param {Array<Object>} datas - Tableau d'objets avec les propriétés :
     *   - label {string} : Nom de la catégorie principale
     *   - category {string} : Nom de la sous-catégorie
     *   - value {number} : Valeur numérique
     *   - color {string} : Couleur hexadécimale
     *   - description {string} : Description optionnelle
     */
    set_datas(datas) {
        this.datas = datas;
    }

    /**
     * Méthode principale pour rendre le graphique
     * Crée toute la structure DOM et SVG nécessaire
     * 
     * @returns {void}
     */
    render()
    {
        // Calcul des totaux par label pour les pourcentages
        const totalsByLabel = d3.rollup(
            this.datas,
            v => d3.sum(v, d => d.value),
            d => d.label
          );

        // Préparation des données pour le stack layout D3
        const stackedSeries = d3.stack()
                                .keys(d3.union(this.datas.map(d => d.category)))
                                .value(([, group], key) => {
                                    const entry = group.get(key);
                                    return entry ? entry.value : 0;
                                })(d3.index(this.datas, d => d.label, d => d.category));

        // Calcul des dimensions du graphique
        const {totalSvgHeight, containerWidth, containerHeight } = this._calculateDimensions(stackedSeries);

        // Création du conteneur principal
        const mainContainer = d3.create("div")
            .attr("class", "SHB-main-container")
            .style("width", containerWidth)
            .style("height", containerHeight + "px");
        
        this.parent.appendChild(mainContainer.node());

        // Conteneur pour l'axe X (en haut)
        const xAxisContainer = mainContainer.append("div")
                                        .style("width", containerWidth + "px")
                                        .style("height", this.DEFAULT_CONFIG.axisXHeight + "px");

        // Création des échelles
        const xScale = this._createXScale(stackedSeries, containerWidth);
        const yScale = this._createYScale(totalSvgHeight);
        
        // Création de l'axe X
        const xAxisSvg = this._createXAxis(xAxisContainer, xScale, containerWidth);

        // Conteneur pour les données (barres + axe Y)
        const dataContainer = mainContainer.append("div")
                                        .attr("class", "shb-data-container")
                                        .style("height", containerHeight - this.DEFAULT_CONFIG.axisXHeight + "px")
                                        .style("width", containerWidth + "px");
        
        // SVG principal pour le graphique
        const chartSvg = dataContainer.append("svg")
            .attr("class", "shb-chart-svg")
            .attr("width", containerWidth)
            .attr("height", totalSvgHeight);

        // Création de l'axe Y
        const yAxis = this._createYAxis(yScale, chartSvg);

        // Création des rectangles (barres)
        const rectangles = this._createRectangles(stackedSeries, xScale, yScale, chartSvg);

        // Configuration des interactions (hover, clic, tooltip)
        this._setupInteractions(rectangles, totalsByLabel);
    }

    /**
     * Configure les interactions utilisateur sur les barres
     * Gère les événements mouseover, mouseout et click
     * 
     * @private
     * @param {d3.Selection} rectangles - Sélection D3 des rectangles
     * @param {d3.InternMap} totalsByLabel - Map des totaux par label pour calculer les pourcentages
     * @returns {void}
     */
    _setupInteractions(rectangles, totalsByLabel) {
        let tooltip = createTooltip();
        let tooltipVisible = false;
    
        rectangles.style("cursor", "pointer")
                .on("mouseover", function(event, d) {
                    // Effet de survol : réduction de l'opacité
                    d3.select(this).attr("opacity", 0.5);
                })
                .on("mouseout", function() {
                    // Retour à l'opacité normale et masquage de la tooltip
                    d3.select(this).attr("opacity", 1);
                    if (tooltipVisible) {
                        tooltip.style("visibility", "hidden");
                        tooltipVisible = false;
                    }
                })
                .on("click", function(event, d) {
                    event.stopPropagation();
                    
                    // Extraction des informations pour la tooltip
                    let value = 0;
                    let valuePercentage = 0;
                    let categoryLabel = "";
                    let categoryColor = "";
    
                    // Recherche des données correspondantes
                    d.data[1].forEach((item, key) => {
                        if (d.key === key) {
                            value = item.value;
                            valuePercentage = item.value / totalsByLabel.get(item.label) || 0;
                            categoryColor = item.color;
                            categoryLabel = key;
                        }
                    });
                        
                    // Affichage de la tooltip avec les informations formatées
                    const formattedPercentage = (valuePercentage * 100).toFixed(1);
            
                    tooltip
                        .style("visibility", "visible")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px")
                        .html(`
                                <p class = "shb-tooltip-header">
                                    ${categoryLabel}
                                </p>
                                <p class = "shb-tooltip-body">
                                    <span>${value}</span>
                                    <span style=" background-color: ${categoryColor};">
                                        ${formattedPercentage} %
                                    </span>
                                </p>
                        `);
                        
                    tooltipVisible = true;
                });
    }

    /**
     * Crée les rectangles représentant les barres du graphique
     * 
     * @private
     * @param {Array} stackedSeries - Données empilées générées par d3.stack()
     * @param {d3.ScaleLinear} xScale - Échelle X pour les valeurs
     * @param {d3.ScaleBand} yScale - Échelle Y pour les labels
     * @param {d3.Selection} chartSvg - SVG conteneur du graphique
     * @returns {d3.Selection} Sélection D3 des rectangles créés
     */
    _createRectangles(stackedSeries, xScale, yScale, chartSvg)
    {
        // Création des groupes pour chaque série (catégorie)
        const barGroups = chartSvg.append("g")
            .selectAll()
            .data(stackedSeries)
            .join("g");
    
        // Création des rectangles pour chaque segment de barre
        return barGroups
            .selectAll("rect")
            .data(D => {
                // Ajout de la clé de la série à chaque datum
                return D.map(d => (d.key = D.key, d))
            })
            .join("rect")
            .attr("x", d => xScale(d[0]) + this.DEFAULT_CONFIG.LABEL_WIDTH)  // Position X + offset pour les labels
            .attr("y", d => yScale(d.data[0]))                              // Position Y selon le label
            .attr("height", yScale.bandwidth())                             // Hauteur de la barre
            .attr("width", d => xScale(d[1]) - xScale(d[0]))               // Largeur selon la valeur
            .attr("fill", d => {
                // Recherche de la couleur correspondante dans les données
                let barColor = "#cccccc";
                d.data[1].forEach((value, key) =>
                {
                    if (d.key === key) {
                        barColor = value.color;
                    }
                });
                return barColor;
            });
    }

    /**
     * Crée l'axe Y (vertical) avec les labels
     * 
     * @private
     * @param {d3.ScaleBand} yScale - Échelle Y pour les labels
     * @param {d3.Selection} chartSvg - SVG conteneur du graphique
     * @returns {d3.Selection} Groupe SVG contenant l'axe Y
     */
    _createYAxis(yScale, chartSvg)
    {
        return chartSvg.append("g")
                    .attr("transform", `translate(${this.DEFAULT_CONFIG.LABEL_WIDTH},0)`)
                    .style('font-size', 0.5 * this.DEFAULT_CONFIG.barHeight + "px")
                    .style("font-family", "sans-serif")
                    .call(d3.axisLeft(yScale).tickSizeOuter(0));
    }

    /**
     * Crée l'axe X (horizontal) avec les valeurs
     * 
     * @private
     * @param {d3.Selection} xAxisContainer - Conteneur DOM pour l'axe X
     * @param {d3.ScaleLinear} xScale - Échelle X pour les valeurs
     * @param {number} containerWidth - Largeur du conteneur
     * @returns {d3.Selection} SVG contenant l'axe X
     */
    _createXAxis(xAxisContainer, xScale, containerWidth)
    {
        const xAxisSvg = xAxisContainer.append("svg")
            .attr("width", containerWidth + "px")
            .attr("height", this.DEFAULT_CONFIG.axisXHeight + "px")
            .style("pointer-events", "none")
            .style("z-index", 1);
        
        xAxisSvg.append("g")
            .attr("transform", `translate(${this.DEFAULT_CONFIG.LABEL_WIDTH},20)`)
            .call(d3.axisTop(xScale).ticks());

        return xAxisSvg;
    }

    /**
     * Crée l'échelle X (linéaire) pour les valeurs
     * 
     * @private
     * @param {Array} stackedSeries - Données empilées pour déterminer le domaine
     * @param {number} containerWidth - Largeur du conteneur
     * @returns {d3.ScaleLinear} Échelle X configurée
     */
    _createXScale(stackedSeries, containerWidth)
    {
        return d3.scaleLinear()
            .domain([0, d3.max(stackedSeries, d => d3.max(d, d => d[1]))])
            .range([0, containerWidth - this.DEFAULT_CONFIG.LABEL_WIDTH - this.DEFAULT_CONFIG.marginRight]);
    }

    /**
     * Crée l'échelle Y (bandes) pour les labels
     * Les labels sont triés par valeur totale décroissante
     * 
     * @private
     * @param {number} totalSvgHeight - Hauteur totale du SVG
     * @returns {d3.ScaleBand} Échelle Y configurée
     */
    _createYScale(totalSvgHeight)
    {
        return d3.scaleBand()
                .domain(d3.groupSort(this.datas, D => -d3.sum(D, d => d.value), d => d.label))
                .range([0, totalSvgHeight - this.DEFAULT_CONFIG.axisXHeight])
                .padding(0.08);
    }

    /**
     * Calcule les dimensions du graphique en fonction des données et du conteneur parent
     * 
     * @private
     * @param {Array} stackedSeries - Données empilées pour compter le nombre de barres
     * @returns {Object} Objet contenant :
     *   - totalSvgHeight {number} : Hauteur totale du SVG
     *   - containerWidth {number} : Largeur du conteneur
     *   - containerHeight {number} : Hauteur du conteneur (limitée à 768px si nécessaire)
     */
    _calculateDimensions(stackedSeries)
    {
        const totalSvgHeight = stackedSeries[0].length * this.DEFAULT_CONFIG.barHeight 
                                + this.DEFAULT_CONFIG.marginTop
                                + this.DEFAULT_CONFIG.marginBottom
                                + this.DEFAULT_CONFIG.axisXHeight;

        let containerWidth = this.parent.clientWidth;

        // console.log("Container width: ", containerWidth);

        // if (containerWidth == 0)
        // {
        //     // Si le parent n'a pas de largeur définie, utiliser une largeur par défaut
        //     console.warn("Le conteneur parent n'a pas de largeur définie, utilisation de 800px par défaut.");
        //     containerWidth = 800;
        // }


        let containerHeight;
        if (this.parent.clientHeight == 0)
        {
            // Si le parent n'a pas de hauteur définie, utiliser la hauteur calculée (max 768px)
            containerHeight = totalSvgHeight > 768 ? 768 : totalSvgHeight;
        }
        else
        {
            // Utiliser la hauteur du parent
            containerHeight = this.parent.clientHeight;
        }
        return { totalSvgHeight, containerWidth, containerHeight };
    }

    /**
     * Transforme les données brutes de l'API en format standardisé
     * 
     * @private
     * @param {Array} rawData - Données brutes de l'API
     * @returns {Array<Object>} Données transformées avec les propriétés :
     *   - label {string} : Nom de la catégorie principale
     *   - category {string} : Nom de la sous-catégorie  
     *   - color {string} : Couleur hexadécimale
     *   - description {string} : Description
     *   - value {number} : Valeur numérique
     */
    _transformRawData(rawData)
    {
        if (!Array.isArray(rawData))
        {
            console.error("Données brutes invalides, attendu un tableau.");
            return [];
        }
  
        return rawData.map
        (
          item => 
          (
            {
              label: item.label || "Sans titre",
              category: item.category || "Général",
              color: item.color || "#666",
              description: item.description || "",
              value: item.value || 0,
            }
          )
        );
    }
}