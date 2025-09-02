import * as d3 from 'd3';
import { UIElement } from '../UIElement.js';

/**
 * Classe Multiline - Composant de graphique en lignes multiples avec D3.js
 * 
 * Cette classe crée un graphique interactif avec plusieurs lignes de données temporelles.
 * Elle hérite de UIElement et utilise D3.js pour la visualisation et l'interaction.
 * 
 * @class Multiline
 * @extends UIElement
 * @author Votre nom
 * @version 1.0.0
 * 
 * @example
 * // Création d'une instance du graphique
 * const chart = new Multiline('api/data', document.getElementById('container'));
 * await chart.obtain_datas();
 * chart.render();
 */
export class Multiline extends UIElement {
    /**
     * Constructeur de la classe Multiline
     * 
     * @param {string} prefixeAPI - Le préfixe de l'API pour récupérer les données
     * @param {HTMLElement} parent - L'élément DOM parent qui contiendra le graphique
     */
    constructor(prefixeAPI, parent)
    {
        super(prefixeAPI, parent);
        
        /** @type {Array<Object>} Tableau des données transformées pour le graphique */
        this.datas = [];
        
        /** @type {boolean} Indicateur de chargement des données */
        this.isLoading = false;
        
        /** @type {d3.Selection|null} Élément SVG principal du graphique */
        this.svg = null;
        
        /** @type {d3.Selection|null} Élément pour afficher le point de survol */
        this.hoverDot = null;
        
        /** @type {d3.Selection|null} Élément pour afficher la description */
        this.descriptionDisplayer = null;
        
        /** @type {d3.Selection|null} Groupe contenant les chemins des lignes */
        this.chartPaths = null;

        /**
         * Configuration par défaut du graphique
         * @type {Object}
         * @property {number} TOP - Marge supérieure
         * @property {number} RIGHT - Marge droite
         * @property {number} BOTTOM - Marge inférieure
         * @property {number} LEFT - Marge gauche
         * @property {number} MIN_HEIGHT - Hauteur minimale
         * @property {number} MIN_WIDTH - Largeur minimale
         * @property {number} LINE_WIDTH - Épaisseur des lignes
         */
        this.DEFAULT_CONFIG = {
            TOP    : 50,
            RIGHT  : 60,
            BOTTOM : 50,
            LEFT   : 60,
            MIN_HEIGHT: 256,
            MIN_WIDTH: 512,
            LINE_WIDTH: 2,
        };
    }

    /**
     * Récupère les données depuis l'API
     * 
     * Effectue une requête HTTP vers l'API spécifiée et transforme les données
     * pour qu'elles soient utilisables par le graphique.
     * 
     * @async
     * @returns {Promise<void>}
     * @throws {Error} Si la requête échoue ou si les données sont invalides
     * 
     * @example
     * await chart.obtain_datas();
     */
    async obtain_datas() {
        if (this.isLoading) return;
        
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
            this.datas = [];
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Méthode principale de rendu du graphique
     * 
     * Cette méthode orchestre tout le processus de création du graphique :
     * - Calcul des dimensions
     * - Création du conteneur SVG
     * - Création des échelles
     * - Ajout des axes
     * - Dessin des lignes
     * - Configuration des interactions
     * 
     * @public
     * @returns {void}
     */
    render()
    {

        this.destroy();
        const { mainContainerWidth, mainContainerHeight } = this._calculateDimensions();
        
        if (!this._checkDimensions(mainContainerWidth, mainContainerHeight))
        {
            return;
        }

        this._createMainContainer();
        this._createSVG(mainContainerWidth, mainContainerHeight);
        
        const { xScale, yScale } = this._createScales(mainContainerWidth, mainContainerHeight);
        this._addAxes(xScale, yScale, mainContainerHeight);
        
        const points = this._calculateAllCoordinates(xScale, yScale);
        const groupedData = this._groupDataIntoArray(points);
        
        this._drawLines(groupedData);
        this._createInteractiveElements();
        this._setupInteractions(points, mainContainerWidth);

    }

    /**
     * Crée le conteneur principal du graphique
     * 
     * @private
     * @returns {void}
     */
    _createMainContainer() {
        const mainContainer = d3.create("div").attr("class", "multiline-main-container");
        this.parent.appendChild(mainContainer.node());
        this.mainContainer = mainContainer;
    }

    /**
     * Crée l'élément SVG principal
     * 
     * @private
     * @param {number} width - Largeur du SVG
     * @param {number} height - Hauteur du SVG
     * @returns {void}
     */
    _createSVG(width, height) {
        this.svg = this.mainContainer.append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    /**
     * Crée les échelles X et Y pour le graphique
     * 
     * @private
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @param {number} mainContainerHeight - Hauteur du conteneur
     * @returns {{xScale: d3.ScaleTime, yScale: d3.ScaleLinear}} Les échelles créées
     */
    _createScales(mainContainerWidth, mainContainerHeight) {
        const xScale = this._createXScale(mainContainerWidth);
        const yScale = this._createYScale(mainContainerHeight);
        return { xScale, yScale };
    }

    /**
     * Ajoute les axes X et Y au graphique
     * 
     * @private
     * @param {d3.ScaleTime} xScale - Échelle de l'axe X
     * @param {d3.ScaleLinear} yScale - Échelle de l'axe Y
     * @param {number} mainContainerHeight - Hauteur du conteneur
     * @returns {void}
     */
    _addAxes(xScale, yScale, mainContainerHeight) {
        this._addXaxis(this.svg, xScale, mainContainerHeight);
        this._addYaxis(this.svg, yScale);
    }

    /**
     * Calcule les coordonnées pour tous les points de données
     * 
     * @private
     * @param {d3.ScaleTime} xScale - Échelle de l'axe X
     * @param {d3.ScaleLinear} yScale - Échelle de l'axe Y
     * @returns {Array<Object>} Tableau des points avec leurs coordonnées
     */
    _calculateAllCoordinates(xScale, yScale) {
        return this.datas.map(d => ({
            ...this._calculateCoordinates(d, xScale, yScale),
        }));
    }

    /**
     * Crée les éléments interactifs (point de survol, description)
     * 
     * @private
     * @returns {void}
     */
    _createInteractiveElements() {
        this._createHoverDot();
        this._createDescriptionDisplayer();
    }

    /**
     * Crée le point de survol qui apparaît lors du hover
     * 
     * @private
     * @returns {void}
     */
    _createHoverDot() {
        this.hoverDot = this.svg.append("g")
            .attr("display", "none");

        this.hoverDot.append("circle")
            .attr("r", 2.5);

        this.hoverDot.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -8);
    }

    /**
     * Crée l'élément d'affichage de la description
     * 
     * @private
     * @returns {void}
     */
    _createDescriptionDisplayer() {
        this.descriptionDisplayer = this.svg.append("g");
        
        this.descriptionDisplayer.append("text")
            .attr("x", this.DEFAULT_CONFIG.LEFT)
            .attr("y", this.svg.attr("height") - (this.DEFAULT_CONFIG.BOTTOM / 2) + 10)
            .attr("font-family", "sans-serif");
    }

    /**
     * Configure les interactions de la souris/tactile
     * 
     * @private
     * @param {Array<Object>} points - Tableau des points de données
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @returns {void}
     */
    _setupInteractions(points, mainContainerWidth) {
        const dateFormatter = d3.timeFormat("%d-%m-%Y");

        this.svg.on("pointerenter", () => this._onPointerEntered());
        this.svg.on("pointermove", (event) => this._onPointerMoved(event, points, dateFormatter, mainContainerWidth));
        this.svg.on("pointerleave", () => this._onPointerLeft());
        this.svg.on("touchstart", event => event.preventDefault(), { passive: false });
    }

    /**
     * Gère l'événement d'entrée du pointeur
     * 
     * @private
     * @returns {void}
     */
    _onPointerEntered() {
        this.chartPaths
            .style("mix-blend-mode", null)
            .style("stroke", "#ddd");
        this.hoverDot.attr("display", null);
    }

    /**
     * Gère l'événement de mouvement du pointeur
     * 
     * @private
     * @param {Event} event - Événement de mouvement
     * @param {Array<Object>} points - Tableau des points de données
     * @param {Function} dateFormatter - Fonction de formatage des dates
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @returns {void}
     */
    _onPointerMoved(event, points, dateFormatter, mainContainerWidth) {
        const [mouseX, mouseY] = d3.pointer(event);
        
        const closestPointIndex = d3.leastIndex(points, (point) => 
            Math.hypot(point.x - mouseX, point.y - mouseY)
        );
        
        const closestPoint = points[closestPointIndex];

        this._highlightLine(closestPoint);
        this._updateHoverDot(closestPoint, dateFormatter, mainContainerWidth);
        this._updateDescription(closestPoint);
    }

    /**
     * Gère l'événement de sortie du pointeur
     * 
     * @private
     * @returns {void}
     */
    _onPointerLeft() {
        this.chartPaths
            .style("mix-blend-mode", "multiply")
            .style("stroke", null);
        this.hoverDot.attr("display", "none");
        this.svg.node().value = null;
        this.svg.dispatch("input", { bubbles: true });
    }

    /**
     * Met en évidence la ligne correspondant au point le plus proche
     * 
     * @private
     * @param {Object} closestPoint - Point le plus proche du curseur
     * @returns {void}
     */
    _highlightLine(closestPoint) {
        this.chartPaths
            .style("stroke", function(d) {
                if (d[0][4] === closestPoint.label) {
                    return d[0][2];
                }
                return "#ddd";
            })
            .filter(d => d[0][4] === closestPoint.label)
            .raise();
    }

    /**
     * Met à jour le point de survol avec les informations du point le plus proche
     * 
     * @private
     * @param {Object} closestPoint - Point le plus proche du curseur
     * @param {Function} dateFormatter - Fonction de formatage des dates
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @returns {void}
     */
    _updateHoverDot(closestPoint, dateFormatter, mainContainerWidth) {
        this.hoverDot.attr("transform", `translate(${closestPoint.x}, ${closestPoint.y})`);

        const { textX, textY } = this._calculateTextPosition(closestPoint, mainContainerWidth);

        this.hoverDot.select("text")
            .text(`${closestPoint.label} : ${dateFormatter(closestPoint.date)} : ${closestPoint.value}`)
            .attr("font-family", "sans-serif")
            .attr("x", textX)
            .attr("y", textY);
    }

    /**
     * Calcule la position du texte pour éviter les débordements
     * 
     * @private
     * @param {Object} closestPoint - Point le plus proche du curseur
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @returns {{textX: number, textY: number}} Position du texte
     */
    _calculateTextPosition(closestPoint, mainContainerWidth) {
        let textX = 0;
        let textY = -15;

        if (closestPoint.x > mainContainerWidth - 100) {
            textX = -80;
        }
        if (closestPoint.x < 100) {
            textX = 80;
        }
        if (closestPoint.y < 60) {
            textY = 30;
        }

        return { textX, textY };
    }

    /**
     * Met à jour la description affichée
     * 
     * @private
     * @param {Object} closestPoint - Point le plus proche du curseur
     * @returns {void}
     */
    _updateDescription(closestPoint) {
        this.descriptionDisplayer.select("text")
            .text(closestPoint.description);
    }

    /**
     * Calcule les dimensions du conteneur principal
     * 
     * @private
     * @returns {{mainContainerWidth: number, mainContainerHeight: number}} Les dimensions calculées
     */
    _calculateDimensions() {   
        const mainContainerWidth = this.parent.clientWidth;
        const parentHeight = this.parent.clientHeight;
        const mainContainerHeight = parentHeight === 0 ? 512 : parentHeight;

        return { mainContainerWidth, mainContainerHeight };
    }

    /**
     * Vérifie que les dimensions sont suffisantes pour afficher le graphique
     * 
     * @private
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @param {number} mainContainerHeight - Hauteur du conteneur
     * @returns {boolean} true si les dimensions sont suffisantes, false sinon
     */
    _checkDimensions(mainContainerWidth, mainContainerHeight) {
        if (mainContainerWidth < this.DEFAULT_CONFIG.MIN_WIDTH || 
            mainContainerHeight < this.DEFAULT_CONFIG.MIN_HEIGHT) {
            console.warn(`Container dimensions are too small: width=${mainContainerWidth}, height=${mainContainerHeight}. Minimum required: width=${this.DEFAULT_CONFIG.MIN_WIDTH}, height=${this.DEFAULT_CONFIG.MIN_HEIGHT}`);
            return false;
        }
        return true;
    }

    /**
     * Crée l'échelle X (temporelle) pour le graphique
     * 
     * @private
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @returns {d3.ScaleTime} L'échelle X créée
     */
    _createXScale(mainContainerWidth) {
        return d3.scaleUtc()
            .domain(d3.extent(this.datas, datum => datum.date))
            .range([this.DEFAULT_CONFIG.LEFT, mainContainerWidth - this.DEFAULT_CONFIG.RIGHT]);
    }

    /**
     * Ajoute l'axe X au graphique
     * 
     * @private
     * @param {d3.Selection} svg - Élément SVG
     * @param {d3.ScaleTime} xScale - Échelle de l'axe X
     * @param {number} mainContainerHeight - Hauteur du conteneur
     * @returns {void}
     */
    _addXaxis(svg, xScale, mainContainerHeight) {
        svg.append("g")
            .attr("transform", `translate(0, ${mainContainerHeight - this.DEFAULT_CONFIG.BOTTOM})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%Y-%m-%d")));
    }

    /**
     * Crée l'échelle Y (linéaire) pour le graphique
     * 
     * @private
     * @param {number} mainContainerHeight - Hauteur du conteneur
     * @returns {d3.ScaleLinear} L'échelle Y créée
     */
    _createYScale(mainContainerHeight)
    {   
        return d3.scaleLinear()
            .domain([0, d3.max(this.datas, datum => datum.value)])
            .range([mainContainerHeight - this.DEFAULT_CONFIG.BOTTOM, this.DEFAULT_CONFIG.TOP]);
    }

    /**
     * Ajoute l'axe Y au graphique
     * 
     * @private
     * @param {d3.Selection} svg - Élément SVG
     * @param {d3.ScaleLinear} yScale - Échelle de l'axe Y
     * @returns {void}
     */
    _addYaxis(svg, yScale) {
        svg.append("g")
            .attr("transform", `translate(${this.DEFAULT_CONFIG.LEFT}, 0)`)
            .call(d3.axisLeft(yScale).ticks(5));
    }

    /**
     * Calcule les coordonnées d'un point de données
     * 
     * @private
     * @param {Object} d - Point de données
     * @param {d3.ScaleTime} xScale - Échelle de l'axe X
     * @param {d3.ScaleLinear} yScale - Échelle de l'axe Y
     * @returns {Object} Objet contenant les coordonnées et métadonnées du point
     */
    _calculateCoordinates(d, xScale, yScale) {
        return {
            x: xScale(d.date),
            y: yScale(d.value),
            label: d.label,
            color: d.color,
            description: d.description,
            date: d.date,
            value: d.value
        };
    }

    /**
     * Groupe les points de données par label pour créer les lignes
     * 
     * @private
     * @param {Array<Object>} points - Tableau des points avec coordonnées
     * @returns {Array<Array>} Tableau de tableaux, chaque sous-tableau représentant une ligne
     */
    _groupDataIntoArray(points) {
        const labelMap = d3.group(points, d => d.label);

        const transformPointIntoArray = (point) => {
            return [point.x, point.y, point.color, point.description, point.label];
        };

        return Array.from(labelMap, ([key, values]) => values.map(transformPointIntoArray));
    }

    /**
     * Dessine les lignes du graphique
     * 
     * @private
     * @param {Array<Array>} groupedData - Données groupées par ligne
     * @returns {void}
     */
    _drawLines(groupedData) {
        const line = d3.line();
        this.chartPaths = this.svg.append("g")
            .attr("class", "multiline-chart-paths")
            .attr("fill", "none")
            .attr("stroke-width", this.DEFAULT_CONFIG.LINE_WIDTH)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .selectAll("path")
            .data(groupedData)
            .join("path")
            .style("mix-blend-mode", "multiply")
            .attr("stroke", (d) => {
                const firstPoint = d[0];
                return firstPoint[2];
            })
            .attr("d", line);
    }

    /**
     * Détruit le graphique et nettoie le DOM
     * 
     * @public
     * @returns {void}
     */
    destroy() {
        if (this.parent) {
            this.parent.innerHTML = '';
        }
    }

    /**
     * Définit les données du graphique
     * 
     * @public
     * @param {Array<Object>} datas - Tableau des données
     * @returns {void}
     */
    set_datas(datas) {
        this.datas = datas;
    }

    /**
     * Définit le préfixe de l'API
     * 
     * @public
     * @param {string} prefixeAPI - Nouveau préfixe de l'API
     * @returns {void}
     */
    set_prefixeAPI(prefixeAPI) {
        this.prefixeAPI = prefixeAPI;
    }

    /**
     * Transforme les données brutes de l'API en format utilisable
     * 
     * @private
     * @param {Array<Object>} rawData - Données brutes de l'API
     * @returns {Array<Object>} Données transformées
     * 
     * @example
     * // Format d'entrée attendu :
     * // [{ label: "Série1", color: "#ff0000", date: "2023-01-01", value: 100, description: "..." }]
     * 
     * // Format de sortie :
     * // [{ label: "Série1", color: "#ff0000", date: Date, value: 100, description: "..." }]
     */
    _transformRawData(rawData) {
        return rawData.map(item => ({
            label: item.label,
            color: item.color,
            date: new Date(item.date),
            value: parseFloat(item.value),
            description: item.description || '',
        }));
    }
}