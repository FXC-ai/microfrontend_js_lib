import * as d3 from 'd3';
import { UIElement } from '../UIElement.js';

/**
 * Génère un tableau de données CalendarDensity pour tous les jours d'une année
 * @param {number} year - L'année pour laquelle générer les données
 * @param {Array} existingData - Données existantes à fusionner
 * @returns {Array<Object>} Tableau contenant un objet par jour de l'année
 */
function generateYearCalendarData(year, existingData)
{
    const data = [];
    
    // Date de début : 1er janvier de l'année
    const startDate = new Date(year, 0, 1); // mois 0 = janvier
    
    // Date de fin : 31 décembre de l'année
    const endDate = new Date(year, 11, 31); // mois 11 = décembre
    
    // Boucle sur tous les jours de l'année
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate)
    {

        let existingItem = existingData.find((item) => {
            return item.date.getUTCFullYear() === currentDate.getUTCFullYear() &&
                   item.date.getUTCMonth() === currentDate.getUTCMonth() &&
                   item.date.getUTCDate() === currentDate.getUTCDate();
        });

        // Création de l'objet pour le jour courant

        if (existingItem)
        {
            // Si l'item existe déjà, on l'utilise
            data.push(existingItem);
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }
        else
        {
            data.push({
                date: new Date(currentDate), // Copie de la date pour éviter les références
                description: "",
                value: null,
                label: "pas d'infos"
            });
        }
        
        // Passage au jour suivant
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
}

export class CalendarDensity extends UIElement
{
    // Configuration par défaut
    static DEFAULT_CONFIG = {
        cellSize: 22,
        marginTop: 15,
        colors: d3.scaleSequential(d3.interpolateRgbBasis(["#f7f7f7", "#009640"])).domain([0, 1])
    };

    static LABELS = {
        days: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
        months: ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    };

    constructor(year, prefixeAPI, parent) {
        super(prefixeAPI, parent);
        this.year = year;
        this.datas = [];
        this.isLoading = false;
        
        // Éléments DOM pour éviter les re-sélections
        this.tooltip = null;
        this.modal = null;
        
        // Configuration calculée
        this.config = {
            ...CalendarDensity.DEFAULT_CONFIG,
            yearHeight: CalendarDensity.DEFAULT_CONFIG.cellSize * 7 + 25,
            svgWidth: (CalendarDensity.DEFAULT_CONFIG.cellSize + 1) * 54 + 60
        };
    }

    set_datas(datas) {
        this.datas = Array.isArray(datas) ? datas : [];
    }

    set_year(year) {
        if (typeof year === 'number' && year > 0) {
            this.year = year;
        }
    }

    async obtain_datas() {
        if (this.isLoading) return; // Éviter les appels multiples
        
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

    async obtain_datas_by_year() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        try {
            const url = `/${this.prefixeAPI}?year=${this.year}`;

            console.log("obtain_datas_by_year() - url", url, this.prefixeAPI);

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

    next_year() {
        this.year++;
        this.obtain_datas_by_year(this.year)
            .then(() => {
                this.render();
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des données pour l\'année suivante:', error);
            });

        this.render();
    }

    previous_year() {
        this.year--;
        this.obtain_datas_by_year(this.year)
            .then(() => {
                this.render();
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des données pour l\'année précédente:', error);
            });
        this.render();
    }

    destroy() {
        this._cleanup();
        this.parent.innerHTML = "";
    }

    _transformRawData(rawData) {
        if (!Array.isArray(rawData)) return [];
        
        return rawData.map(item => ({
            date: new Date(item.date),
            description: item.description || '',
            value: item.value || 0,
            label: item.label || ''
        }));
    }

    _cleanup() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    render() {
        // Nettoyage avant re-rendu
        this._cleanup();
        this.parent.innerHTML = "";
        
        const all_days = generateYearCalendarData(this.year, this.datas);
        
        // Utilitaires
        const getDayOfWeek = date => date.getUTCDay();
        const timeWeekCounter = d3.utcSunday;
        const dateFormatter = d3.timeFormat("%A %d %B %Y");
        const shortDateFormatter = d3.timeFormat("%d %B %Y");
        
        // Calcul des dimensions
        const containerWidth = this.parent.clientWidth || "100%";
        const containerHeight = this.parent.clientHeight || 
            (this.config.yearHeight + this.config.marginTop);
        
        // Création du conteneur principal
        const calendarContainer = this._createMainContainer(containerWidth, containerHeight);
        
        // Création des composants
        this._createHeader(calendarContainer);
        const calendarDensityBody = this._createBody(calendarContainer);
        const { leftButton, rightButton, calendarDiv } = this._createNavigation(calendarDensityBody);
        const calendarSvg = this._createSVG(calendarDiv);
        
        // Rendu des éléments du calendrier
        this._renderDayLabels(calendarSvg, getDayOfWeek);
        this._renderMonthLabels(calendarSvg, timeWeekCounter);
        const calendarCells = this._renderCells(calendarSvg, all_days, timeWeekCounter, getDayOfWeek);
        
        // Interactions
        this._setupTooltip(calendarCells, dateFormatter);
        this._setupModal(calendarCells, shortDateFormatter);
        this._setupNavigation(leftButton, rightButton);
    }

    _createMainContainer(width, height) {
        const container = d3.create("div")
            .style("height", typeof height === 'number' ? height + "px" : height)
            .style("width", typeof width === 'number' ? width + "px" : width)
            .attr("class", "calendar-density-container");
        
        this.parent.appendChild(container.node());
        return container;
    }

    _createHeader(container) {
        return container.append('div')
            .style("width", this.config.svgWidth + 60 + "px")
            .attr('class', 'calendar-density-header')
            .text(this.year);
    }

    _createBody(container) {
        return container.append('div')
            .style("display", "flex")
            .style("align-items", "center")
            .style("width", this.config.svgWidth + 60 + "px")
            .style("height", this.config.yearHeight + "px")
            .attr('class', 'calendar-density-body');
    }

    _createNavigation(body) {
        const leftButton = body.append('div')
            .attr('class', 'calendar-density-nav-button')
            .style("height", this.config.yearHeight + "px")
            .html("‹");
        
        const calendarDiv = body.append('div')
            .style("width", this.config.svgWidth + "px")
            .style("height", this.config.yearHeight + "px");
        
        const rightButton = body.append('div')
            .attr('class', 'calendar-density-nav-button')
            .style("height", this.config.yearHeight + "px")
            .html("›");

        return { leftButton, rightButton, calendarDiv };
    }

    _createSVG(container) {
        return container.append("svg")
            .attr("width", this.config.svgWidth + "px")
            .attr("height", this.config.yearHeight + "px");
    }

    _renderDayLabels(svg, getDayOfWeek) {
        svg.append('g')
            .attr('class', 'calendar-density-days-labels')
            .selectAll('text')
            .data(d3.range(7).map(dayIndex => new Date(1999, 0, dayIndex)))
            .join('text')
            .attr('x', "20px")
            .attr('y', dayDate => {
                const adjustedDayIndex = (getDayOfWeek(dayDate) + 6) % 7;
                return adjustedDayIndex * (this.config.cellSize + 1) + this.config.marginTop + 12;
            })
            .text(dayDate => CalendarDensity.LABELS.days[dayDate.getUTCDay()]);
    }

    _renderMonthLabels(svg, timeWeekCounter) {
        svg.append('g')
            .selectAll('text')
            .data(CalendarDensity.LABELS.months.map((month, index) => ({
                date: new Date(this.year, index, 1),
                label: month
            })))
            .join('text')
            .attr("x", dataPoint => {
                return timeWeekCounter.count(d3.timeYear(dataPoint.date), dataPoint.date) * 
                    (this.config.cellSize + 1) + 60;
            })
            .attr("y", this.config.marginTop - 2)
            .text(dataPoint => dataPoint.label)
            .style("font-family", "sans-serif")
            .style("font-size", "12px");
    }

    _renderCells(svg, allDays, timeWeekCounter, getDayOfWeek) {
        return svg.append('g')
            .selectAll('rect')
            .data(allDays)
            .join('rect')
            .attr("width", this.config.cellSize - 1)
            .attr("height", this.config.cellSize - 1)
            .attr("fill", dataPoint => {
                if (dataPoint.value == null) {
                    return dataPoint.date.getUTCMonth() % 2 === 0 ? "#d9d8d4" : "#f2f1ed";
                }
                return this.config.colors(dataPoint.value);
            })
            .attr("x", dataPoint => 
                timeWeekCounter.count(d3.timeYear(dataPoint.date), dataPoint.date) * 
                (this.config.cellSize + 1) + 60
            )
            .attr("y", dataPoint => {
                const adjustedDayIndex = (getDayOfWeek(dataPoint.date) + 0) % 7;
                return adjustedDayIndex * (this.config.cellSize + 1) + this.config.marginTop;
            })
            .attr("class", "calendar-density-cell");
    }

    _setupTooltip(cells, dateFormatter) {
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");
        
        cells
            .on("mouseover", (event, dataPoint) => {
                this.tooltip.html(`
                    <div style="font-family: sans-serif;">
                        <strong>Date:</strong> ${dateFormatter(dataPoint.date)}
                    </div>
                `);
                this.tooltip.style("visibility", "visible");
            })
            .on("mousemove", (event) => {
                this.tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", () => {
                this.tooltip.style("visibility", "hidden");
            });
    }

    _setupModal(cells, shortDateFormatter) {
        this.modal = d3.select("body")
            .append("div")
            .attr("class", "modal");
        
        const modalContent = this.modal.append("div")
            .attr("class", "modal-content");

        this.modal.on("click", (event) => {
            event.stopPropagation();
            this.modal.style("visibility", "hidden");
        });

        cells.on("click", (event, dataPoint) => {
            event.stopPropagation();
            modalContent.html("");
            
            modalContent.append("h2")
                .attr("class", "modal-header")
                .text(shortDateFormatter(dataPoint.date));
            
            this.modal.style("visibility", "visible");

            modalContent
                .append("h4")
                .attr("class", "modal-header")
                .html(dataPoint.label || "Aucun label disponible");

            modalContent
                .append("div")
                .attr("class", "modal-description")
                .html(dataPoint.description || "Aucune description disponible");
        });
    }

    _setupNavigation(leftButton, rightButton) {
        leftButton.on("click", () => {
            this.previous_year();
        });

        rightButton.on("click", () => {
            this.next_year();
        });
    }

}