import * as d3 from 'd3';
import { UIElement } from '../UIElement.js';

/**
 * Crée un élément tooltip pour afficher les détails des tranches du graphique
 * @returns {d3.Selection} - Élément DOM du tooltip
 */
function createTooltip() {
    return d3.select("body")
        .append("div")
        .attr("class", "pie-tooltip");
}

/**
 * Composant graphique en secteurs (pie chart) utilisant D3.js
 * 
 * Cette classe permet de créer et d'afficher un graphique en secteurs interactif
 * avec des tooltips et des labels. Elle hérite de UIElement pour bénéficier
 * des fonctionnalités de base des composants UI.
 * 
 * @extends UIElement
 * 
 * @example
 * // Création d'un graphique en secteurs
 * const container = document.getElementById('chart-container');
 * const pieChart = new Pie('api/data', container);
 * 
 * // Définition manuelle des données
 * pieChart.set_datas([
 *   { label: 'Secteur A', value: 30, color: '#ff6b6b', description: 'Description A' },
 *   { label: 'Secteur B', value: 45, color: '#4ecdc4', description: 'Description B' },
 *   { label: 'Secteur C', value: 25, color: '#45b7d1', description: 'Description C' }
 * ]);
 * 
 * // Rendu du graphique
 * pieChart.render();
 * 
 * @author Votre nom
 * @version 1.0.0
 */
export class Pie extends UIElement {
    /**
     * Constructeur de la classe Pie
     * 
     * @param {string} prefixeAPI - Préfixe de l'URL de l'API pour récupérer les données
     * @param {HTMLElement} parent - Élément DOM parent où sera inséré le graphique
     */
    constructor(prefixeAPI, parent) {
        super(prefixeAPI, parent);
        
        /** @type {Array<Object>} Données du graphique transformées */
        this.datas = [];
        
        /** @type {boolean} Indicateur de chargement des données */
        this.isLoading = false;
        
        /** @type {d3.Selection|null} Référence au tooltip D3 */
        this.tooltip = null;
        
        /** @type {d3.Selection|null} Référence au SVG principal */
        this.svg = null;

        /** @type {Object} Configuration par défaut du composant */
        this.DEFAULT_CONFIG = {
            MIN_WIDTH: 256,   // Largeur minimale en pixels
            MIN_HEIGHT: 256,  // Hauteur minimale en pixels
        };
    }

    /**
     * Récupère les données depuis l'API et les transforme pour le graphique
     * 
     * Cette méthode effectue un appel HTTP GET vers l'endpoint défini par prefixeAPI,
     * puis transforme les données brutes en format utilisable par le graphique.
     * 
     * @async
     * @returns {Promise<void>}
     * 
     * @throws {Error} En cas d'erreur HTTP ou de problème de réseau
     * 
     * @example
     * // Récupération des données depuis l'API
     * await pieChart.obtain_datas();
     * pieChart.render();
     */
    async obtain_datas()
    {
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
        }
        catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.datas = [];
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Transforme les données brutes de l'API en format standardisé
     * 
     * @private
     * @param {Array} rawData - Données brutes provenant de l'API
     * @returns {Array<Object>} Données transformées avec les propriétés standardisées
     * 
     */
    _transformRawData(rawData) {
        if (!Array.isArray(rawData)) {
            console.warn('Les données brutes ne sont pas un tableau');
            return [];
        }
        
        return rawData
            .filter(item => item && typeof item === 'object')
            .map(item => ({
                label: String(item.label || ''),
                color: item.color || '#cccccc',
                value: Math.max(0, Number(item.value) || 0),
                description: String(item.description || ''),
            }))
            .filter(item => item.value > 0);
    }

    /**
     * Effectue le rendu complet du graphique en secteurs
     * 
     * Cette méthode principale orchestre toutes les étapes de création :
     * - Calcul des dimensions
     * - Création du conteneur SVG
     * - Génération des secteurs
     * - Ajout des labels
     * - Configuration des interactions
     * 
     * @public
     * @returns {void}
     * 
     * @example
     * // Rendu après chargement des données
     * await pieChart.obtain_datas();
     * pieChart.render();
     * 
     * // Rendu avec données manuelles
     * pieChart.set_datas(myData);
     * pieChart.render();
     */
    render() {

        if (!Array.isArray(this.datas) || this.datas.length === 0) {
            console.warn('Aucune donnée à afficher');
            return;
        }

        // Nettoyage des éléments existants
        this.destroy();

        // Calcul des dimensions du conteneur
        const { mainContainerWidth, mainContainerHeight, radius } = this._calculateDimensions();

        // Vérification des dimensions minimales
        if (!this._checkDimensions(mainContainerWidth, mainContainerHeight)) {
            return;
        }

        // Création du conteneur principal
        const mainContainer = d3.create("div")
            .attr("class", "pie-main-container")
            .style("width", mainContainerWidth + "px")
            .style("height", mainContainerHeight + "px");

        this.parent.appendChild(mainContainer.node());

        // Calcul du centre du graphique
        const { centerX, centerY } = this._calculateCenter(mainContainerWidth, mainContainerHeight);

        // Configuration du générateur de secteurs D3
        const pieGenerator = d3.pie()
            .sort(null)
            .value(d => d.value);

        // Configuration de l'arc (forme en anneau)
        const sliceArc = d3.arc()
            .innerRadius(radius * 0.67)  // Rayon intérieur (67% du rayon total)
            .outerRadius(radius - 1);     // Rayon extérieur avec marge

        // Génération des données de secteurs
        const pieSlices = pieGenerator(this.datas);

        // Création du SVG
        this.svg = mainContainer.append("svg")
            .attr("width", mainContainerWidth + "px")
            .attr("height", mainContainerHeight + "px");

        // Dessin des secteurs
        const slicePaths = this._drawPieChart(this.svg, pieSlices, sliceArc, centerX, centerY);

        // Création du tooltip
        this.tooltip = createTooltip();

        // Configuration du formateur de pourcentages
        const percentFormatter = new Intl.NumberFormat('fr-FR', { 
            style: 'percent', 
            minimumFractionDigits: 1, 
            maximumFractionDigits: 1 
        });

        // Calcul de la somme totale des valeurs
        const dataSum = d3.fsum(this.datas, (d) => d.value);

        // Ajout des labels sur les secteurs
        const labels = this._addLabels(this.svg, pieSlices, sliceArc, centerX, centerY, percentFormatter, dataSum);

        // Configuration des interactions (hover, tooltips)
        this._setupInteractions(slicePaths, this.tooltip, percentFormatter, dataSum);
        this._setupInteractions(labels, this.tooltip, percentFormatter, dataSum);

    }

    /**
     * Configure les interactions utilisateur (survol, tooltips) pour les éléments du graphique
     * 
     * @private
     * @param {d3.Selection} elemToInteract - Éléments D3 auxquels ajouter les interactions
     * @param {d3.Selection} tooltip - Référence au tooltip
     * @param {Intl.NumberFormat} percentFormatter - Formateur de pourcentages
     * @param {number} dataSum - Somme totale des valeurs pour le calcul des pourcentages
     * @returns {void}
     */
    _setupInteractions(elemToInteract, tooltip, percentFormatter, dataSum) {
        elemToInteract
            .on("mouseover", (event, slice) => {
                // Effet visuel au survol
                d3.select(event.currentTarget)
                    .attr("opacity", 0.7);

                // Contenu HTML du tooltip
                tooltip.html(`
                    <div class="tooltip-header">
                        <h3 class="tooltip-title" style="color: ${slice.data.color}">${slice.data.label}</h3>
                    </div>
                    <table class="tooltip-table">
                        <tr>
                            <td class="tooltip-label">Description:</td>
                            <td class="tooltip-value">${slice.data.description}</td>
                        </tr>
                        <tr>
                            <td class="tooltip-label">Quantité:</td>
                            <td class="tooltip-value">${slice.data.value}</td>
                        </tr>
                        <tr>
                            <td class="tooltip-label">Part:</td>
                            <td class="tooltip-value">${percentFormatter.format(slice.data.value / dataSum)}</td>
                        </tr>
                    </table>
                `);

                tooltip.style("visibility", "visible");
            })
            .on("mousemove", (event, slice) => {
                // Positionnement du tooltip suivant la souris
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", (event) => {
                // Restauration de l'opacité et masquage du tooltip
                d3.select(event.currentTarget)
                    .attr("opacity", 1);
                
                tooltip.style("visibility", "hidden");
            });
    }

    /**
     * Calcule les dimensions du conteneur et du rayon du graphique
     * 
     * @private
     * @returns {Object} Objet contenant les dimensions calculées
     * @returns {number} returns.mainContainerWidth - Largeur du conteneur
     * @returns {number} returns.mainContainerHeight - Hauteur du conteneur  
     * @returns {number} returns.radius - Rayon du graphique
     */
    _calculateDimensions() {
        const mainContainerWidth = this.parent.clientWidth === 0 ? 256 : this.parent.clientWidth;
        const mainContainerHeight = this.parent.clientHeight === 0 ? 256 : this.parent.clientHeight;
        const radius = 0.5 * Math.min(mainContainerHeight, mainContainerWidth);

        return {
            mainContainerWidth,
            mainContainerHeight,
            radius
        };
    }

    /**
     * Vérifie si les dimensions du conteneur respectent les minimums requis
     * 
     * @private
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @param {number} mainContainerHeight - Hauteur du conteneur
     * @returns {boolean} True si les dimensions sont suffisantes, false sinon
     */
    _checkDimensions(mainContainerWidth, mainContainerHeight) {
        if (mainContainerHeight < this.DEFAULT_CONFIG.MIN_HEIGHT ||
            mainContainerWidth < this.DEFAULT_CONFIG.MIN_WIDTH) {
            console.warn("Container dimensions are below minimum requirements.");
            return false;
        }
        return true;
    }

    /**
     * Calcule les coordonnées du centre du graphique
     * 
     * @private
     * @param {number} mainContainerWidth - Largeur du conteneur
     * @param {number} mainContainerHeight - Hauteur du conteneur
     * @returns {Object} Coordonnées du centre
     * @returns {number} returns.centerX - Coordonnée X du centre
     * @returns {number} returns.centerY - Coordonnée Y du centre
     */
    _calculateCenter(mainContainerWidth, mainContainerHeight) {
        const centerX = mainContainerWidth / 2;
        const centerY = mainContainerHeight / 2;
        return { centerX, centerY };
    }

    /**
     * Dessine les secteurs du graphique en utilisant D3.js
     * 
     * @private
     * @param {d3.Selection} svg - Élément SVG parent
     * @param {Array} pieSlices - Données des secteurs générées par d3.pie()
     * @param {d3.Arc} sliceArc - Générateur d'arc D3
     * @param {number} centerX - Coordonnée X du centre
     * @param {number} centerY - Coordonnée Y du centre
     * @returns {d3.Selection} Sélection des chemins SVG créés
     */
    _drawPieChart(svg, pieSlices, sliceArc, centerX, centerY) {
        const slicePaths = svg.append("g")
            .attr("transform", `translate(${centerX},${centerY})`)
            .selectAll()
            .data(pieSlices)
            .join("path")
            .attr("fill", slice => slice.data.color)
            .attr("d", sliceArc);
                        
        return slicePaths;
    }

    /**
     * Ajoute les labels textuels sur les secteurs du graphique
     * 
     * Les labels affichent le nom du secteur et le pourcentage correspondant.
     * Ils ne sont visibles que si l'angle du secteur est suffisamment grand.
     * 
     * @private
     * @param {d3.Selection} svg - Élément SVG parent
     * @param {Array} pieSlices - Données des secteurs
     * @param {d3.Arc} sliceArc - Générateur d'arc pour calculer les centroides
     * @param {number} centerX - Coordonnée X du centre
     * @param {number} centerY - Coordonnée Y du centre
     * @param {Intl.NumberFormat} percentFormatter - Formateur de pourcentages
     * @param {number} dataSum - Somme totale des valeurs
     * @returns {d3.Selection} Sélection des éléments texte créés
     */
    _addLabels(svg, pieSlices, sliceArc, centerX, centerY, percentFormatter, dataSum) {
        const labels = svg.append("g")
            .attr("transform", `translate(${centerX},${centerY})`)
            .attr("text-anchor", "middle")
            .selectAll()
            .data(pieSlices)
            .join("text")
            .attr("transform", slice => {
                return `translate(${sliceArc.centroid(slice)})`
            })
            // Ajout du nom du secteur (visible si angle > 0.25 radians)
            .call(text => text.filter(slice => (slice.endAngle - slice.startAngle) > 0.25)
                .append("tspan")
                .attr("y", "-0.4em")
                .attr("font-weight", "bold")
                .attr("font-family", "sans-serif")
                .text(slice => slice.data.label))
            // Ajout du pourcentage (visible si angle > 0.30 radians)
            .call(text => text.filter(slice => (slice.endAngle - slice.startAngle) > 0.30)
                .append("tspan")
                .attr("x", 0)
                .attr("y", "0.7em")
                .attr("fill-opacity", 0.7)
                .attr("font-family", "sans-serif")
                .text(slice => percentFormatter.format(slice.data.value / dataSum)));
        
        return labels;
    }

    /**
     * Nettoie et supprime tous les éléments du graphique
     * 
     * Cette méthode doit être appelée avant chaque nouveau rendu pour éviter
     * les éléments orphelins et les fuites mémoire.
     * 
     * @public
     * @returns {void}
     */
    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        if (this.svg) {
            this.svg.remove();
            this.svg = null;
        }
        
        const existingContainer = this.parent.querySelector('.pie-main-container');
        if (existingContainer) {
            existingContainer.remove();
        }
    }
    
    /**
     * Définit manuellement les données du graphique
     * 
     * @public
     * @param {Array<Object>} datas - Tableau d'objets représentant les données
     * @param {string} datas[].label - Nom du secteur
     * @param {number} datas[].value - Valeur numérique du secteur
     * @param {string} datas[].color - Couleur hexadécimale du secteur
     * @param {string} datas[].description - Description détaillée du secteur
     * @returns {void}
     * 
     * @example
     * pieChart.set_datas([
     *   { label: 'Ventes', value: 1200, color: '#ff6b6b', description: 'Revenus des ventes' },
     *   { label: 'Marketing', value: 800, color: '#4ecdc4', description: 'Budget marketing' }
     * ]);
     */
    set_datas(datas) {
        this.datas = datas;
    }

    /**
     * Modifie le préfixe de l'API pour le chargement des données
     * 
     * @public
     * @param {string} prefixeAPI - Nouveau préfixe de l'URL de l'API
     * @returns {void}
     * 
     * @example
     * pieChart.set_prefixeAPI('api/v2/statistics');
     */
    set_prefixeAPI(prefixeAPI) {
        this.prefixeAPI = prefixeAPI;
    }
}