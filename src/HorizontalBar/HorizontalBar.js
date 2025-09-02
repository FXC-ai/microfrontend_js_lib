import * as d3 from 'd3';
import { UIElement } from "../UIElement";

/**
 * Crée et retourne un élément tooltip pour les graphiques en barres horizontales
 * @returns {d3.Selection} L'élément tooltip créé
 */
function createTooltip() {
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "horizontal-bar-tooltip");
    return tooltip;
}

/**
 * Classe pour créer et gérer des graphiques en barres horizontales
 * Utilise D3.js pour le rendu et supporte les interactions (tooltip, survol)
 * 
 * @extends UIElement
 * 
 * @example
 * // Utilisation basique
 * const chart = new HorizontalBar("api/data", parentElement);
 * await chart.obtain_datas();
 * chart.render();
 * 
 * @example
 * // Utilisation avec données personnalisées
 * const chart = new HorizontalBar("api/data", parentElement);
 * chart.set_datas([
 *   { label: "Item 1", value: 100, color: "#ff0000", description: "Description 1" },
 *   { label: "Item 2", value: 200, color: "#00ff00", description: "Description 2" }
 * ]);
 * chart.render();
 */
export class HorizontalBar extends UIElement {
    /**
     * Constructeur de la classe HorizontalBar
     * 
     * @param {string} prefixeAPI - Préfixe de l'URL de l'API pour récupérer les données
     * @param {HTMLElement} parent - Élément DOM parent où sera inséré le graphique
     */
    constructor(prefixeAPI, parent) {
        super(prefixeAPI, parent);

        /** @type {Array<Object>} Données du graphique */
        this.datas = [];

        /** @type {boolean} Indicateur de chargement des données */
        this.isLoading = false;

        /** @type {Object} Configuration par défaut du graphique */
        this.DEFAULT_CONFIG = {
            /** @type {number} Hauteur de chaque barre en pixels */
            BAR_HEIGHT: 25,
            /** @type {number} Marge à droite du graphique */
            MARGINRIGHT: 20,
            /** @type {number} Hauteur de l'axe X */
            XAXISHEIGHT: 30,
            /** @type {number} Largeur réservée aux labels */
            LABELSIZE: 200,
            /** @type {number} Taille de la police */
            FONTSIZE: 12,
            /** @type {number} Largeur minimale du conteneur */
            MIN_CONTAINER_WIDTH: 400,
            /** @type {number} Hauteur minimale du conteneur */
            MIN_CONTAINER_HEIGHT: 55,
            /** @type {number} Hauteur maximale du conteneur */
            MAX_CONTAINER_HEIGHT: 768
        }
    }
    
    /**
     * Récupère les données depuis l'API de manière asynchrone
     * Empêche les appels multiples simultanés via un système de verrouillage
     * 
     * @async
     * @throws {Error} Erreur HTTP ou de réseau
     * 
     * @example
     * try {
     *   await chart.obtain_datas();
     *   console.log("Données chargées:", chart.datas);
     * } catch (error) {
     *   console.error("Erreur de chargement:", error);
     * }
     */
    async obtain_datas() {
        // Empêche les appels multiples simultanés
        if (this.isLoading)
        {
            return;
        }
        
        this.isLoading = true;
        try
        {
            const url = `/${this.prefixeAPI}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const rawData = await response.json();
            this.datas = this._transformRawData(rawData);
            console.log("this.datas apres transformation = ", this.datas);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.datas = [];
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Transforme les données brutes de l'API en format utilisable par le graphique
     * Assure la cohérence des données et applique des valeurs par défaut
     * 
     * @param {Array<Object>} rawData - Données brutes depuis l'API
     * @param {string} rawData[].label - Libellé de l'élément
     * @param {number} rawData[].value - Valeur numérique
     * @param {string} [rawData[].color] - Couleur en format hexadécimal
     * @param {string} [rawData[].description] - Description optionnelle
     * @returns {Array<Object>} Données formatées pour le graphique
     * 
     * @private
     */
    _transformRawData(rawData) {
        // Transforme les données brutes en un format utilisable

        console.log("rawData", rawData);
        return rawData.map
        (item => ({ 
            label: item.label,
            value: parseFloat(item.value),
            color: item.color || "#000000", // Couleur par défaut : noir
            description: item.description || '' // Description vide par défaut
        }));
    }

    /**
     * Méthode principale de rendu du graphique
     * Orchestre toutes les étapes de création : dimensions, conteneurs, échelles, axes, barres, interactions
     * 
     * @throws {Error} Si les dimensions sont insuffisantes pour le rendu
     * 
     * @example
     * chart.render(); // Rendu avec les données actuelles
     */
    render()
    {
        this.parent.innerHTML = "";

        // Calcul des dimensions globales
        const {totalSvgHeight, mainContainerWidth, mainContainerHeight} = this._calculateDimensions();

        console.log("hb", totalSvgHeight, mainContainerWidth, mainContainerHeight);
                
        // Vérification que les dimensions sont suffisantes
        if (!this._checkDimensions(mainContainerWidth, mainContainerHeight))
        {
            return;
        }

        // Création du conteneur principal
        const mainContainer = d3.create("div")
            .attr("class", "horizontal-bar-chart")
            .style("width", mainContainerWidth + "px")
            .style("height", mainContainerHeight + "px")
            .style("overflow", "hidden")
            .style("box-sizing", "border-box");

        console.log("mainContainer", mainContainer);
            
        this.parent.appendChild(mainContainer.node());

        // Création des échelles pour les axes X et Y
        const {xScale, yScale} = this._createScales(mainContainerWidth, totalSvgHeight);

        // Ajout de l'axe X (en haut du graphique)
        const xAxisContainer = this._addXaxis(mainContainer, mainContainerWidth, xScale);

        // Création du conteneur scrollable pour le graphique
        const divChart = this._addChartContainer(mainContainer, mainContainerWidth, mainContainerHeight);

        // Création du SVG principal du graphique
        const chartSvg = this._addChartSvg(divChart, mainContainerWidth, totalSvgHeight);

        // Ajout de l'axe Y (labels à gauche)
        const yAxis = this._addYAxis(yScale, chartSvg);

        // Création des barres horizontales
        const bars = this._addBars(xScale, yScale, chartSvg);

        // Ajout des labels de valeurs sur les barres
        const valueLabels = this._addBarLabels(chartSvg, xScale, yScale);


        // Création du tooltip
        const tooltip = createTooltip();


        // Configuration des interactions (survol, tooltip)
        this._setupInteraction(bars, tooltip);
    }

    /**
     * Calcule les dimensions nécessaires pour le graphique
     * Prend en compte le nombre de données et les contraintes du conteneur parent
     * 
     * @returns {Object} Objet contenant les dimensions calculées
     * @returns {number} returns.totalSvgHeight - Hauteur totale du SVG
     * @returns {number} returns.mainContainerWidth - Largeur du conteneur principal
     * @returns {number} returns.mainContainerHeight - Hauteur du conteneur principal
     * 
     * @private
     */
    _calculateDimensions() {
        // Hauteur basée sur le nombre de barres + padding
        const totalSvgHeight = (this.datas.length + 0.1) * this.DEFAULT_CONFIG.BAR_HEIGHT;


        // Largeur = largeur du parent
        const mainContainerWidth = this.parent.clientWidth;

        let mainContainerHeight;
        // Si le parent n'a pas de hauteur définie, calcul automatique
        if (this.parent.clientHeight === 0)
        {
            mainContainerHeight = totalSvgHeight + this.DEFAULT_CONFIG.XAXISHEIGHT > this.DEFAULT_CONFIG.MAX_CONTAINER_HEIGHT ? this.DEFAULT_CONFIG.MAX_CONTAINER_HEIGHT : totalSvgHeight + this.DEFAULT_CONFIG.XAXISHEIGHT;
            console.log(mainContainerHeight, "mainContainerHeight");
        }
        else
        {
            // Utilise la hauteur du parent
            mainContainerHeight = this.parent.clientHeight;
            console.log(mainContainerHeight, "le parent a une hauteur", this.parent.clientHeight);

        }

        console.log("totalSvgHeight, ", totalSvgHeight,this.DEFAULT_CONFIG.XAXISHEIGHT ,mainContainerWidth, mainContainerHeight);
        return {totalSvgHeight, mainContainerWidth, mainContainerHeight};
    }

    /**
     * Vérifie que les dimensions calculées respectent les minimums requis
     * 
     * @param {number} mainContainerWidth - Largeur du conteneur principal
     * @param {number} mainContainerHeight - Hauteur du conteneur principal
     * @returns {boolean} true si les dimensions sont suffisantes, false sinon
     * 
     * @private
     */
    _checkDimensions(mainContainerWidth, mainContainerHeight)
    {
        if
        (
            mainContainerWidth < this.DEFAULT_CONFIG.MIN_CONTAINER_WIDTH
            || mainContainerHeight < this.DEFAULT_CONFIG.MIN_CONTAINER_HEIGHT
        )
        {
            console.warn("Dimensions insuffisantes pour le graphique.");
            return false;
        }
        return true;
    }

    /**
     * Crée les échelles D3 pour les axes X et Y
     * L'axe X utilise une échelle linéaire, l'axe Y une échelle en bandes
     * 
     * @param {number} mainContainerWidth - Largeur du conteneur principal
     * @param {number} totalSvgHeight - Hauteur totale du SVG
     * @returns {Object} Objet contenant les échelles
     * @returns {d3.ScaleLinear} returns.xScale - Échelle linéaire pour l'axe X
     * @returns {d3.ScaleBand} returns.yScale - Échelle en bandes pour l'axe Y
     * 
     * @private
     */
    _createScales(mainContainerWidth, totalSvgHeight)
    {
        // Échelle linéaire pour les valeurs (axe X)

        console.log("this.datas", this.datas);
        console.log("d3.max(this.datas, d => d.value)", d3.max(this.datas, d => d.value));
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(this.datas, d => d.value)])
            .range([
                0,
                mainContainerWidth
                     - this.DEFAULT_CONFIG.LABELSIZE 
                     - this.DEFAULT_CONFIG.MARGINRIGHT]);

        // Échelle en bandes pour les labels (axe Y)
        // Les données sont triées par valeur décroissante
        const yScale = d3.scaleBand()
                .domain(d3.sort(this.datas, d => -d.value).map(d => d.label))
                .rangeRound([0, totalSvgHeight])
                .padding(0.1); // Espacement entre les barres
        
        return { xScale, yScale };
    }

    /**
     * Ajoute l'axe X (horizontal) en haut du graphique
     * 
     * @param {d3.Selection} mainContainer - Conteneur principal
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @param {d3.ScaleLinear} xScale - Échelle pour l'axe X
     * @returns {d3.Selection} Le conteneur de l'axe X
     * 
     * @private
     */
    _addXaxis(mainContainer, mainContainerWidth, xScale)
    {
        const xAxisContainer = mainContainer.append("div")
            .style("width", mainContainerWidth + "px")
            .style("height", this.DEFAULT_CONFIG.XAXISHEIGHT + "px");
    
        const xAxisSvg = xAxisContainer.append("svg")
            .attr("width", mainContainerWidth)
            .attr("height", this.DEFAULT_CONFIG.XAXISHEIGHT)
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("z-index", 1);

        // Axe en haut avec graduation automatique
        xAxisSvg.append("g")
            .attr("transform", `translate(${this.DEFAULT_CONFIG.LABELSIZE}, ${this.DEFAULT_CONFIG.XAXISHEIGHT})`)
            .call(d3.axisTop(xScale).ticks())
            .call(g => g.selectAll(".domain").remove()); // Supprime la ligne de l'axe
        
        return xAxisContainer;
    }

    /**
     * Ajoute le conteneur scrollable pour le graphique
     * Permet le défilement vertical si le contenu dépasse la hauteur disponible
     * 
     * @param {d3.Selection} mainContainer - Conteneur principal
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @param {number} mainContainerHeight - Hauteur du conteneur
     * @returns {d3.Selection} Le conteneur du graphique
     * 
     * @private
     */
    _addChartContainer(mainContainer, mainContainerWidth, mainContainerHeight) {
        const divChart = mainContainer.append("div")
                                    .attr("class", "hb-container-chart")
                                    .style("height", mainContainerHeight - this.DEFAULT_CONFIG.XAXISHEIGHT + "px")
                                    .style("overflow-y", "auto") // Défilement vertical si nécessaire
                                    .style("width", mainContainerWidth + "px");
        return divChart;
    }

    /**
     * Ajoute l'élément SVG principal où seront dessinées les barres
     * 
     * @param {d3.Selection} divChart - Conteneur du graphique
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @param {number} totalSvgHeight - Hauteur totale du SVG
     * @returns {d3.Selection} L'élément SVG du graphique
     * 
     * @private
     */
    _addChartSvg(divChart, mainContainerWidth, totalSvgHeight) {
        const chartSvg = divChart.append("svg")
                                .style("width", mainContainerWidth - this.DEFAULT_CONFIG.MARGINRIGHT + "px")
                                .attr("height", totalSvgHeight + "px")
                                .style("display", "block");
        return chartSvg;
    }

    /**
     * Ajoute l'axe Y (vertical) avec les labels des données
     * 
     * @param {d3.ScaleBand} yScale - Échelle pour l'axe Y
     * @param {d3.Selection} chartSvg - Élément SVG du graphique
     * @returns {d3.Selection} L'axe Y créé
     * 
     * @private
     */
    _addYAxis(yScale, chartSvg) {
        const yAxis = chartSvg.append("g")
            .attr("transform", `translate(${this.DEFAULT_CONFIG.LABELSIZE},0)`)
            .call(d3.axisLeft(yScale).tickSizeOuter(0)) // Axe à gauche sans trait extérieur
            .selectAll("text")
            .style("font-size", this.DEFAULT_CONFIG.FONTSIZE + "px");
        return yAxis;
    }

    /**
     * Crée et ajoute les barres horizontales du graphique
     * Chaque barre est colorée selon les données et positionnée selon les échelles
     * 
     * @param {d3.ScaleLinear} xScale - Échelle pour l'axe X
     * @param {d3.ScaleBand} yScale - Échelle pour l'axe Y
     * @param {d3.Selection} chartSvg - Élément SVG du graphique
     * @returns {d3.Selection} Les barres créées
     * 
     * @private
     */
    _addBars(xScale, yScale, chartSvg) {
        const bars = chartSvg.append("g")
                            .selectAll()
                            .data(this.datas)
                            .join("rect")
                            .attr("fill", d => d.color)
                            .attr("x", this.DEFAULT_CONFIG.LABELSIZE) // Position X fixe (après les labels)
                            .attr
                            (
                                "y",
                                d =>
                                {
                                    console.log("Pour le y : ", yScale(d.label));
                                    return yScale(d.label);
                                }
                            )
                            .attr("width", d =>
                                {
                                // Largeur proportionnelle à la valeur
                                console.log(xScale(d.value), " - ", xScale(0), " = " ,xScale(d.value) - xScale(0));
                                return (xScale(d.value) - xScale(0));
                                }
                            )
                            .attr("height", yScale.bandwidth()); // Hauteur de la bande

        return bars;
    }

    /**
     * Ajoute les labels de valeurs sur les barres
     * Les labels sont positionnés intelligemment : à l'intérieur pour les barres longues,
     * à l'extérieur pour les barres courtes
     * 
     * @param {d3.Selection} chartSvg - Élément SVG du graphique
     * @param {d3.ScaleLinear} xScale - Échelle pour l'axe X
     * @param {d3.ScaleBand} yScale - Échelle pour l'axe Y
     * @returns {d3.Selection} Les labels de valeurs créés
     * 
     * @private
     */
    _addBarLabels(chartSvg, xScale, yScale) {
        const valueLabels = chartSvg.append("g")
                                    .attr("fill", "white") // Couleur par défaut (barres longues)
                                    .attr("text-anchor", "end") // Alignement par défaut à droite
                                    .selectAll()
                                    .data(this.datas)
                                    .join("text")
                                    .attr("x", d => (xScale(d.value) - xScale(0)) + this.DEFAULT_CONFIG.LABELSIZE)
                                    .attr("y", d => yScale(d.label) + yScale.bandwidth() / 2) // Centré verticalement
                                    .attr("dy", "0.35em") // Ajustement vertical fin
                                    .attr("dx", -4) // Décalage horizontal (intérieur)
                                    .text(d => d.value)
                                    // Traitement spécial pour les barres courtes
                                    .call(text => text.filter(d => (xScale(d.value) - xScale(0)) < 40) // Barres < 40px
                                        .attr("dx", +4) // Décalage à l'extérieur
                                        .attr("fill", "black") // Couleur contrastée
                                        .attr("text-anchor", "start")); // Alignement à gauche

        return valueLabels;
    }

    /**
     * Configure les interactions utilisateur (survol, tooltip)
     * Gère l'affichage du tooltip avec les détails de chaque barre
     * 
     * @param {d3.Selection} bars - Les barres du graphique
     * @param {d3.Selection} tooltip - L'élément tooltip
     * 
     * @private
     */
    _setupInteraction(bars, tooltip) {
        const percentageFormat = d3.format(".2%"); // Format pourcentage avec 2 décimales
        const sum = d3.sum(this.datas, d => d.value); // Somme totale pour le calcul des pourcentages

        bars.on("mouseover", function(event, d) {
            // Effet visuel sur la barre survolée
            d3.select(this).attr("opacity", 0.5);
            
            // Contenu du tooltip avec informations détaillées
            tooltip.html(`
                <div class="tooltip-header">
                    <h3 class="tooltip-title" style="color: ${d.color}">${d.label}</h3>
                </div>
                <table class="tooltip-table">
                <tr>
                    <td>Valeur:</td>
                    <td>${d.value}</td>
                </tr>
                <tr>
                    <td>Description:</td>
                    <td>${d.description}</td>
                </tr>
                <tr>
                    <td>Pourcentage:</td>
                    <td>${percentageFormat(d.value/sum)}</td>
                </tr>
                </table>
            `);
            tooltip.style("visibility", "visible");
        })
        .on("mousemove", function(event, d) {
            // Mise à jour de la position du tooltip selon la souris
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function() {
            // Restauration de l'état normal
            d3.select(this).attr("opacity", 1);
            tooltip.style("visibility", "hidden");
        });
    }

    /**
     * Méthode de nettoyage appelée lors de la destruction du composant
     * À implémenter selon les besoins (suppression d'événements, nettoyage DOM, etc.)
     * 
     */
    destroy(tooltip, svg, mainContainer)
    {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
        
        if (svg) {
            svg.remove();
            svg = null;
        }
        
        if (mainContainer) {
            mainContainer.remove();
        }
    }

    /**
     * Définit manuellement les données du graphique
     * Alternative à obtain_datas() pour utiliser des données locales
     * 
     * @param {Array<Object>} datas - Tableau des données
     * @param {string} datas[].label - Libellé de l'élément
     * @param {number} datas[].value - Valeur numérique
     * @param {string} [datas[].color] - Couleur en format hexadécimal
     * @param {string} [datas[].description] - Description optionnelle
     * 
     * @example
     * chart.set_datas([
     *   { label: "Ventes", value: 1200, color: "#ff6b6b", description: "Chiffre d'affaires" },
     *   { label: "Marketing", value: 800, color: "#4ecdc4", description: "Budget publicitaire" }
     * ]);
     */
    set_datas(datas) {
        this.datas = datas;
    }

    /**
     * Définit le préfixe de l'API (actuellement non implémenté)
     * 
     * @param {string} prefixeAPI - Nouveau préfixe de l'API
     */
    set_prefixeAPI(prefixeAPI) {
        this.prefixeAPI = prefixeAPI;
    }
}