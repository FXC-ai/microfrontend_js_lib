import {
    addDays,
    calendarMonthlyLimits,
    dateToISO,
    dayNames,
    monthNames
} from "./datetime";

/**
 * @fileoverview Module de gestion d'un calendrier mensuel interactif
 */

// ================================
// CONSTANTES
// ================================

/** Durée d'une heure en millisecondes */
const HOUR_IN_MS = 60 * 60 * 1000;

/** Nombre maximum de tentatives de récupération des données */
const MAX_RETRY_ATTEMPTS = 3;

/** Délai entre les tentatives de récupération (en ms) */
const RETRY_DELAY = 1000;

// ================================
// FONCTIONS UTILITAIRES
// ================================

/**
 * Crée un élément tooltip pour afficher les détails d'un événement
 * @returns {HTMLElement} L'élément tooltip créé
 */
function createTooltip(): HTMLElement {
    let tooltip = document.createElement("div");
    tooltip.classList.add("event-tooltip");
    document.body.appendChild(tooltip);
    return tooltip;
}

/**
 * Formate une date en chaîne lisible (MM/DD/YYYY HH:MM:SS)
 * @param {Date} d - La date à formater
 * @returns {string} La date formatée
 */
function dateFormater(d: Date): string {
    return [d.getMonth() + 1,
            d.getDate(),
            d.getFullYear()].join('/') + ' ' +
           [d.getHours().toString().padStart(2, '0'),
            d.getMinutes().toString().padStart(2, '0'),
            d.getSeconds().toString().padStart(2, '0')].join(':');
}

/**
 * Convertit une date en chaîne au format ISO (YYYY-MM-DD)
 * @param {Date} d - La date à convertir
 * @returns {string} La date au format ISO
 */
function datetimeToDateString(d: Date): string {
    return [
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate(),
    ].join('-');
}

/**
 * Nettoie et échappe le HTML pour éviter les injections XSS
 * @param {string} str - La chaîne à nettoyer
 * @returns {string} La chaîne nettoyée
 */
function sanitizeHTML(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Vérifie si une date est valide
 * @param {Date} date - La date à vérifier
 * @returns {boolean} True si la date est valide
 */
function isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Valide la structure des données reçues de l'API
 * @param {any} data - Les données à valider
 * @returns {boolean} True si les données sont valides
 */
function validateApiData(data: any): boolean {
    if (!Array.isArray(data)) return false;
    return data.every(item => 
        item && 
        typeof item === 'object' && 
        item.b && 
        item.subject && 
        item.color
    );
}

// ================================
// INTERFACES ET TYPES
// ================================

/**
 * Interface représentant un événement de calendrier
 * @interface DataCalendarMonth
 */
export interface DataCalendarMonth {
    /** Date de début de l'événement */
    b: Date;
    /** Date de fin de l'événement (optionnelle) */
    e: Date | null;
    /** Indique si l'événement dure toute la journée */
    all_day: boolean;
    /** Titre/sujet de l'événement */
    subject: string;
    /** Couleur d'affichage de l'événement (format hex) */
    color: string;
    /** Description détaillée de l'événement (optionnelle) */
    description: string | null;
}

// ================================
// CLASSE PRINCIPALE
// ================================

/**
 * Classe principale pour la gestion d'un calendrier mensuel interactif
 * 
 * Fonctionnalités principales :
 * - Affichage d'un calendrier mensuel
 * - Navigation entre les mois
 * - Gestion des événements avec tooltips
 * - Cache des données pour améliorer les performances
 * - Gestion d'erreurs et retry automatique
 * - Interface responsive et accessible
 * 
 * @example
 * ```typescript
 * const calendar = new CalendarMonth('api/events', containerElement, 2024, 0);
 * await calendar.obtain_datas();
 * calendar.render();
 * ```
 * 
 * @class CalendarMonth
 */
export class CalendarMonth
{
    /** Préfixe de l'URL de l'API pour récupérer les événements */
    prefixeAPI: string;
    
    /** Élément HTML parent qui contiendra le calendrier */
    parent: HTMLElement;
    
    /** Année affichée (optionnelle, auto-détectée si non fournie) */
    year?: number;
    
    /** Mois affiché (0-11, optionnel, auto-détecté si non fourni) */
    month?: number;
    
    /** Tableau des événements du mois courant */
    data: DataCalendarMonth[];
    
    /** Indique si une requête est en cours */
    isLoading: boolean;

    /** Vérifie la validité des paramètres */
    isValid : boolean;

    /** Configuration par défaut (pour extensions futures) */
    DEFAULT_CONFIG = {};
    
    // ================================
    // PROPRIÉTÉS PRIVÉES
    // ================================
    
    /** Gestionnaires d'événements DOM pour le nettoyage */
    private eventListeners: Array<{ element: Element; event: string; handler: EventListener }> = [];
    
    /** Référence vers le tooltip actuellement affiché */
    private activeTooltip: HTMLElement | null = null;
    
    /** Cache des données pour éviter les requêtes répétées */
    private cache: Map<string, DataCalendarMonth[]> = new Map();
    
    /** Compteur de tentatives de retry */
    private retryCount: number = 0;

    /**
     * Constructeur de la classe CalendarMonth
     * 
     * @param {string} prefixeAPI - Préfixe de l'URL de l'API (ex: 'api/events')
     * @param {HTMLElement} parent - Élément HTML qui contiendra le calendrier
     * @param {number} [year] - Année à afficher (optionnelle, auto-détectée)
     * @param {number} [month] - Mois à afficher 0-11 (optionnel, auto-détecté)
     * 
     * @throws {Error} Si prefixeAPI n'est pas une chaîne
     * @throws {Error} Si parent n'est pas un HTMLElement valide
     * 
     * @example
     * ```typescript
     * // Calendrier pour janvier 2024
     * const calendar = new CalendarMonth('api/events', document.getElementById('calendar'), 2024, 0);
     * 
     * // Calendrier auto-détecté (première date des événements)
     * const calendar = new CalendarMonth('api/events', document.getElementById('calendar'));
     * ```
     */
    constructor
    (
        prefixeAPI: string,
        parent: HTMLElement,
        year: number | undefined = undefined,
        month: number | undefined = undefined,
    )
    {
        // Validation des paramètres
        this.isValid = this._isValid(prefixeAPI, parent);

        this.prefixeAPI = prefixeAPI;
        this.parent = parent;

        if (year && typeof year === 'number' && year > 0)
        {
            this.year = year;
        }
        else
        {
            const baseUrl: string = new URL(window.location.href).origin + "/";
            const url: URL = new URL(this.prefixeAPI, baseUrl);

            const year_in_url: string | null = url.searchParams.get("year");

            if (year_in_url && !isNaN(year_in_url as any))
            {
                this.year = parseInt(year_in_url, 10);
            }
            else
            {
                this.year = new Date().getFullYear();
            }
        }
        if (month && typeof month === 'number' && month > 0 && month <= 12)
        {
            this.month = month;
        }
        else
        {
            const baseUrl = new URL(window.location.href).origin + "/";
            const url = new URL(this.prefixeAPI, baseUrl);
            const monthInUrl = url.searchParams.get("month");
            const parsedMonth = monthInUrl ? parseInt(monthInUrl, 10) : NaN;
            
            this.month = (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) 
                ? parsedMonth - 1
                : new Date().getMonth();
        }

        console.log(this.year, this.month);

        this.isLoading = false;

        // Nettoyage automatique lors de la fermeture de la page
        window.addEventListener('beforeunload', () => this._cleanup());
    }

    

    private _isValid (prefixeAPI, parent) : boolean
    {
        if (typeof prefixeAPI !== 'string')
        {
            console.warn("Error : prefixeAPI");
            return false;
        }
        if (!parent || !(parent instanceof HTMLElement))
        {
            console.warn("Error : calendarMonth parent does not exists or is not an instance of HTMLElement");
            return false
        }
        if (parent.clientHeight != 0 && parent.clientHeight < 384)
        {
            console.warn("parent height must be > 384px");
            return false;
        }
        if (parent.clientWidth != 0 && parent.clientWidth < 512)
        {
            console.warn("parent width must be > 512px");
            return false;
        }
        return true
    }

    // ================================
    // MÉTHODES PRIVÉES DE GESTION
    // ================================

    /**
     * Ajoute un gestionnaire d'événement et le stocke pour nettoyage ultérieur
     * @private
     * @param {Element} element - L'élément sur lequel ajouter l'événement
     * @param {string} event - Le type d'événement (click, mouseover, etc.)
     * @param {EventListener} handler - La fonction gestionnaire
     */
    private _addEventListener(element: Element, event: string, handler: EventListener): void {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * Supprime tous les gestionnaires d'événements enregistrés
     * @private
     */
    private _removeEventListeners(): void {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    /**
     * Nettoie les tooltips actifs
     * @private
     */
    private _cleanupTooltips(): void {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }
    }

    /**
     * Nettoyage général de l'instance (gestionnaires, tooltips, cache)
     * @private
     */
    private _cleanup(): void {
        this._removeEventListeners();
        this._cleanupTooltips();
        this.cache.clear();
    }

    /**
     * Génère une clé de cache basée sur le mois et l'année
     * @private
     * @param {number} [month] - Le mois (optionnel)
     * @param {number} [year] - L'année (optionnelle)
     * @returns {string} La clé de cache
     */
    private _getCacheKey(month?: number, year?: number): string {
        return `${year || 'init'}-${month || 'init'}`;
    }

    /**
     * Effectue une requête HTTP avec retry automatique en cas d'échec
     * @private
     * @param {string} url - L'URL à récupérer
     * @param {number} [retries=MAX_RETRY_ATTEMPTS] - Nombre de tentatives restantes
     * @returns {Promise<any>} Les données récupérées
     * @throws {Error} Si toutes les tentatives échouent
     */
    private async _fetchWithRetry(url: string, retries = MAX_RETRY_ATTEMPTS): Promise<any> {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!validateApiData(data)) {
                throw new Error("Invalid API response format");
            }
            
            this.retryCount = 0; // Reset on success
            return data;
        } catch (error) {
            if (retries > 0) {
                this.retryCount++;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * this.retryCount));
                return this._fetchWithRetry(url, retries - 1);
            }
            throw error;
        }
    }

    // ================================
    // MÉTHODES PUBLIQUES - ACCESSEURS
    // ================================

    /**
     * Récupère l'année actuellement affichée
     * @returns {number | undefined} L'année ou undefined si non définie
     */
    get_year(): number | undefined {
        return this.year;
    }

    /**
     * Récupère le mois actuellement affiché
     * @returns {number | undefined} Le mois (0-11) ou undefined si non défini
     */
    get_month(): number | undefined {
        return this.month;
    }

    /**
     * Récupère l'élément parent du calendrier
     * @returns {HTMLElement} L'élément parent
     */
    get_parent(): HTMLElement {
        return this.parent;
    }

    // ================================
    // MÉTHODES PUBLIQUES - DONNÉES
    // ================================

    /**
     * Récupère les données pour un mois et une année spécifiques
     * @private
     * @param {number} month - Le mois (0-11)
     * @param {number} year - L'année
     */
    async _obtain_data_with_param(month: number, year: number)
    {
        this.isLoading = true;
        try
        {
            const { b, e } = calendarMonthlyLimits(month, year);
            const url = `/${this.prefixeAPI}?date_begin=${datetimeToDateString(b)}&date_end=${datetimeToDateString(e)}`;

            const rawData = await this._fetchWithRetry(url);
            this.data = this._transformRawData(rawData);
            this.data = this.data.sort((a, b) => a.b.getTime() - b.b.getTime());

            // Mise en cache des données
            const cacheKey = this._getCacheKey(month, year);
            this.cache.set(cacheKey, [...this.data]);

        }
        catch (error)
        {
            console.error('Erreur lors du chargement des données:', error);
            this.data = [];
            this._showErrorMessage('Erreur lors du chargement des données du calendrier');
        }
        finally
        {
            this.isLoading = false;
        }
    }

    /**
     * Récupère toutes les données sans paramètres de date
     * Utilisé quand le mois/année ne sont pas spécifiés au constructeur
     * @private
     */
    async obtain_datas()
    {
        this.isLoading = true;
        try
        {
            const url = `/${this.prefixeAPI}`;

            const rawData = await this._fetchWithRetry(url);
            this.data = this._transformRawData(rawData);
            this.data = this.data.sort((a, b) => a.b.getTime() - b.b.getTime());

            console.log(this.data);

            // Auto-détection du mois/année depuis le premier événement
            // if (this.data.length > 0)
            // {
            //     this.year = this.data[0].b.getFullYear();
            //     this.month = this.data[0].b.getMonth();
            // }

            // Mise en cache des données
            const cacheKey = this._getCacheKey();
            this.cache.set(cacheKey, [...this.data]);

        }
        catch (error)
        {
            console.error('Erreur lors du chargement des données:', error);
            this.data = [];
            this._showErrorMessage('Erreur lors du chargement initial des données');
        }
        finally
        {
            this.isLoading = false;
        }
    }

    /**
     * Affiche un message d'erreur dans le calendrier
     * @private
     * @param {string} message - Le message d'erreur à afficher
     */
    private _showErrorMessage(message: string): void {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('calendar-error');
        errorDiv.textContent = message;
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '10px';
        errorDiv.style.textAlign = 'center';
        this.parent.appendChild(errorDiv);
    }

    // ================================
    // MÉTHODES PUBLIQUES - NAVIGATION
    // ================================

    /**
     * Navigue vers le mois suivant
     * 
     * @example
     * ```typescript
     * calendar.obtain_data_next_month();
     * ```
     */
    obtain_data_next_month() {
        this._performNextMonth();
    }

    /**
     * Navigue vers le mois précédent
     * 
     * @example
     * ```typescript
     * calendar.obtain_data_previous_month();
     * ```
     */
    obtain_data_previous_month() {
        this._performPrevMonth();
    }

    /**
     * Exécute la navigation vers le mois suivant
     * @private
     */
    private _performNextMonth()
    {
        if (this.month != undefined && this.year != undefined)
        {
            this.month = (this.month + 1) % 12;

            if (this.month == 0) this.year += 1;

            const baseUrl = new URL(window.location.href).origin + "/";

            const url = new URL(this.prefixeAPI, baseUrl);
            
            url.searchParams.set("year", this.year.toString());

            url.searchParams.set("month", (this.month + 1).toString());
            
            this.prefixeAPI = url.pathname.replace(/^\//, '') + url.search;

            (   
                async () =>
                {
                    try
                    {
                        await this.obtain_datas();
                        this.render();
                    }
                    catch (error)
                    {
                        console.error('Navigation error:', error);
                    }
                }
            )();
        }
    }

    /**
     * Exécute la navigation vers le mois précédent
     * @private
     */
    private _performPrevMonth()
    {
        if (this.month != undefined && this.year != undefined)
        {
            this.month = (this.month + 11) % 12;
            if (this.month == 11) this.year -= 1;

            const baseUrl = new URL(window.location.href).origin + "/";

            const url = new URL(this.prefixeAPI, baseUrl);
            
            url.searchParams.set("year", this.year.toString());

            url.searchParams.set("month", (this.month + 1).toString());
            
            this.prefixeAPI = url.pathname.replace(/^\//, '') + url.search;

            (
                async () =>
                {
                    try
                    {
                        await this.obtain_datas();
                        this.render();
                    }
                    catch (error)
                    {
                        console.error('Navigation error:', error);
                    }
                }
            )();
        }
    }

    // ================================
    // MÉTHODES PRIVÉES - TRANSFORMATION
    // ================================

    /**
     * Transforme les données brutes de l'API en objets DataCalendarMonth
     * Valide et nettoie les données reçues
     * @private
     * @param {any[]} rawData - Les données brutes de l'API
     * @returns {DataCalendarMonth[]} Les données transformées et validées
     */
    _transformRawData(rawData: any[]): DataCalendarMonth[] {
        return rawData
            .map(item => {
                try
                {
                    const startDate = new Date(item.b);
                    const endDate = item.e ? new Date(item.e) : null;
                    
                    if (!isValidDate(startDate)) {
                        console.warn('Invalid start date:', item.b);
                        return null;
                    }
                    
                    if (endDate && !isValidDate(endDate)) {
                        console.warn('Invalid end date:', item.e);
                        return null;
                    }

                    return {
                        b: startDate,
                        e: endDate,
                        all_day: Boolean(item.all_day),
                        subject: sanitizeHTML(item.subject || ''),
                        color: item.color || '#000000',
                        description: typeof item.description === 'string' ? sanitizeHTML(item.description) : null
                    };
                }
                catch (error)
                {
                    console.warn('Error transforming data item:', item, error);
                    return null;
                }
            })
            .filter((item): item is DataCalendarMonth => item !== null);
    }

    // ================================
    // MÉTHODES PRIVÉES - RENDU
    // ================================

    /**
     * Crée l'en-tête du calendrier avec titre et boutons de navigation
     * @private
     */
    _createCalendarHeader() {
        if (this.month == undefined || this.year == undefined) {
            return;
        }
        
        // Div month header
        let month_header = document.createElement('div');
        month_header.classList.add('month-header');

        // Div button next
        const div_button_next = document.createElement('div');
        div_button_next.classList.add('div-button-next');

        // Button next
        const button_next = document.createElement('button');
        button_next.type = 'button';
        button_next.innerHTML = 'Suivant ▶';
        button_next.classList.add('nav-button');

        const nextHandler = () => this.obtain_data_next_month();
        this._addEventListener(button_next, "click", nextHandler);

        div_button_next.appendChild(button_next);

        // Div button previous
        const div_button_previous = document.createElement('div');
        div_button_previous.classList.add('div-button-previous');

        // Button previous
        const button_previous = document.createElement('button');
        button_previous.type = 'button';
        button_previous.innerHTML = '◀ Précédent';
        button_previous.classList.add('nav-button');
        
        const prevHandler = () => this.obtain_data_previous_month();
        this._addEventListener(button_previous, "click", prevHandler);
        
        div_button_previous.appendChild(button_previous);

        // Div title
        const title = document.createElement('div');
        title.classList.add('title-month');
        title.innerHTML = monthNames[this.month] + " " + this.year.toString();
        
        // Ajout des div au header
        month_header.appendChild(div_button_previous);
        month_header.appendChild(title);
        month_header.appendChild(div_button_next);

        // Ajout du header au parent
        this.parent.appendChild(month_header);
    }

    /**
     * Crée les en-têtes des jours de la semaine
     * @private
     */
    _createDays() {
        if (this.month == undefined || this.year == undefined) {
            return;
        }
        for (let i = 0; i < 7; i++) {
            let day = document.createElement('div');
            day.classList.add('day-header');
            let dayName = document.createElement('div');
            dayName.innerHTML = dayNames[i];
            dayName.classList.add('day-name');
            day.appendChild(dayName);
            this.parent.appendChild(day);
        }
    }

    /**
     * Crée la grille des jours du mois
     * Génère tous les jours visibles (y compris ceux des mois précédent/suivant)
     * @private
     */
    _addDivInDays() {
        if (this.month == undefined || this.year == undefined) {
            return;
        }

        let limits = calendarMonthlyLimits(this.month, this.year);
        const fragment = document.createDocumentFragment();

        for (let date = limits.b; date <= limits.e; date = addDays(date, 1)) {
            let iso = dateToISO(date);
            let day = document.createElement('day');
            day.setAttribute("data-date", iso);
            day.setAttribute("data-dow", date.getDay().toString());

            // Marquer les week-ends
            if (date.getDay() == 0 || date.getDay() == 6) {
                day.classList.add('weekend');
            }

            // Marquer les jours hors du mois courant
            if (date.getMonth() != this.month) {
                day.classList.add('disabled');
            }

            let back = document.createElement('day-background');
            day.appendChild(back);

            let dayName = document.createElement('div');
            dayName.classList.add('day-name');
            dayName.innerHTML = date.getDate().toString();
            back.appendChild(dayName);

            let foreground = document.createElement('day-foreground');
            foreground.setAttribute("draggable", "false");
            day.appendChild(foreground);

            fragment.appendChild(day);
        }
        
        this.parent.appendChild(fragment);
    }

    /**
     * Ajoute un événement visuel dans un jour donné
     * @private
     * @param {DataCalendarMonth} eventDay - L'événement à afficher
     * @param {HTMLElement} foreground - L'élément où ajouter l'événement
     * @returns {HTMLElement} L'élément DOM de l'événement créé
     */
    _addEvent(eventDay: DataCalendarMonth, foreground: HTMLElement): HTMLElement {
        let eventDom = document.createElement('div');
        eventDom.classList.add('event');
        eventDom.style.backgroundColor = eventDay.color;

        const timeDisplay = eventDay.all_day ? 
            'Toute la journée' : 
            `${eventDay.b.getHours().toString().padStart(2, '0')}h${eventDay.b.getMinutes().toString().padStart(2, '0')}`;

        eventDom.innerHTML = `<p>${timeDisplay} ${eventDay.subject}</p>`;
        
        foreground.appendChild(eventDom);

        // Effets visuels au survol
        const mouseoverHandler = function() {
            eventDom.style.opacity = "0.7";
            eventDom.style.cursor = "pointer";
        };

        const mouseleaveHandler = function() {
            eventDom.style.opacity = "1";
        };

        this._addEventListener(eventDom, "mouseover", mouseoverHandler);
        this._addEventListener(eventDom, "mouseleave", mouseleaveHandler);

        return eventDom;
    }

    /**
     * Configure les interactions tooltip pour un événement
     * Gère l'affichage des détails au clic et la fermeture
     * @private
     * @param {HTMLElement} eventDom - L'élément DOM de l'événement
     * @param {DataCalendarMonth} eventDay - Les données de l'événement
     */
    _setupTooltipInteraction(eventDom: HTMLElement, eventDay: DataCalendarMonth)
    {
        const clickHandler = (e: Event) => {
            this._cleanupTooltips();
            
            const tooltip = createTooltip();
            this.activeTooltip = tooltip;
            
            const dateEnd = eventDay.e ? dateFormater(eventDay.e) : 'Pas d\'horaire de fin';
            const allDay = eventDay.all_day ? "Journée entière" : "Selon horaire";

            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h3 class="tooltip-title" style="color: ${eventDay.color}">${eventDay.subject}</h3>
                </div>
                <table class="tooltip-table">
                    <tr>
                        <td>Début : </td>
                        <td>${dateFormater(eventDay.b)}</td>
                    </tr>
                    <tr>
                        <td>Fin :</td>
                        <td>${dateEnd}</td>
                    </tr>
                    <tr>
                        <td>Journée entière :</td>
                        <td>${allDay}</td>
                    </tr>
                    <tr>
                        <td>Description :</td>
                        <td>${eventDay.description}</td>
                    </tr>
                </table>
            `;

            // Positionnement intelligent du tooltip
            if (e instanceof MouseEvent) {
                const rect = tooltip.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                let left = e.pageX + 10;
                let top = e.pageY + 10;
                
                // Éviter que le tooltip sorte de l'écran
                if (left + rect.width > windowWidth) {
                    left = e.pageX - rect.width - 10;
                }
                if (top + rect.height > windowHeight) {
                    top = e.pageY - rect.height - 10;
                }
                
                tooltip.style.left = left + "px";
                tooltip.style.top = top + "px";
            }

            document.body.appendChild(tooltip);
        };

        const mouseleaveHandler = () => {
            eventDom.style.opacity = "1";
            if (this.activeTooltip) {
                this.activeTooltip.remove();
                this.activeTooltip = null;
            }
        };

        this._addEventListener(eventDom, "click", clickHandler);
        this._addEventListener(eventDom, "mouseleave", mouseleaveHandler);
    }

    /**
     * Configure le défilement pour les jours avec beaucoup d'événements
     * Affiche/cache la scrollbar selon les besoins
     * @private
     * @param {HTMLElement} foreground - L'élément à rendre scrollable
     */
    _setupScrollInteraction(foreground: HTMLElement) {
        if (foreground.clientHeight < foreground.scrollHeight) {
            const mouseenterHandler = function() {
                foreground.style.overflowY = "scroll";
            };

            const mouseleaveHandler = function() {
                foreground.style.overflowY = "hidden";
            };

            this._addEventListener(foreground, "mouseenter", mouseenterHandler);
            this._addEventListener(foreground, "mouseleave", mouseleaveHandler);
        }
    }

    // ================================
    // MÉTHODES PUBLIQUES - RENDU
    // ================================

    /**
     * Rend le calendrier complet dans l'élément parent
     * Efface le contenu précédent et reconstruit l'interface
     * 
     * @example
     * ```typescript
     * await calendar.obtain_datas();
     * calendar.render(); // Affiche le calendrier avec les événements
     * ```
     */
    render()
    {
        if (!this.isValid) return;
        if (this.month == undefined || this.year == undefined) {
            return;
        }
        this._destroy();
        this.parent.classList.add("calendar-month");

        this._createCalendarHeader();
        this._createDays();
        this._addDivInDays();

        // Premier passage : ajout des événements
        this.iterateDays(
            false,
            (d, background, foreground, current_date) => {
                const targetDay = new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate());

                // Récupère tous les événements pour la date donnée
                let eventsDay = this.data.filter(event => {
                    const date_event = new Date(event.b.getFullYear(), event.b.getMonth(), event.b.getDate());
                    return date_event.getTime() === targetDay.getTime();
                });

                // Ajoute les événements au calendrier
                eventsDay.forEach(eventDay => {
                    let eventDom = this._addEvent(eventDay, foreground);
                    this._setupTooltipInteraction(eventDom, eventDay);
                });
            }
        );

        // Deuxième passage : configuration du défilement
        this.iterateDays(
            false,
            (d, background, foreground, current_date) => {
                this._setupScrollInteraction(foreground);
            }
        );
    }

    /**
     * Itère sur tous les jours du calendrier et exécute une callback
     * Utile pour appliquer des traitements sur chaque jour
     * 
     * @param {boolean} activeDayOnly - Si true, ignore les week-ends et jours désactivés
     * @param {Function} cb - Callback à exécuter pour chaque jour
     * 
     * @example
     * ```typescript
     * calendar.iterateDays(false, (dayElement, background, foreground, date) => {
     *     console.log(`Processing day: ${date.toDateString()}`);
     * });
     * ```
     */
    iterateDays(
        activeDayOnly: boolean,
        cb: (d: HTMLElement, background: HTMLElement, forground: HTMLElement, date: Date) => void
    ) {
        this.parent.querySelectorAll('day').forEach(elem => {
            if (activeDayOnly && (elem.classList.contains('weekend') || elem.classList.contains('disabled'))) {
                return;
            }
            
            const dateStr = elem.getAttribute('data-date');
            if (!dateStr) return;
            
            let date = new Date(dateStr);
            if (!isValidDate(date)) return;
            
            let back = elem.querySelector('day-background');
            let forground = elem.querySelector('day-foreground');
            
            if (back && forground) {
                cb((elem as HTMLElement), (back as HTMLElement), (forground as HTMLElement), date);
            }
        });
    }

    /**
     * Ajoute manuellement un événement au calendrier
     * L'événement sera affiché immédiatement s'il correspond au mois courant
     * 
     * @param {DataCalendarMonth} event - L'événement à ajouter
     * 
     * @example
     * ```typescript
     * const newEvent: DataCalendarMonth = {
     *     b: new Date(2024, 0, 15, 10, 0), // 15 janvier 2024 à 10h00
     *     e: new Date(2024, 0, 15, 11, 0), // 15 janvier 2024 à 11h00
     *     all_day: false,
     *     subject: "Réunion équipe",
     *     color: "#ff0000",
     *     description: "Réunion hebdomadaire de l'équipe"
     * };
     * calendar.addEvent(newEvent);
     * ```
     */
    addEvent = (event: DataCalendarMonth) => {
        if (!isValidDate(event.b)) {
            console.error("Cannot add event with invalid date", event);
            return;
        }

        let eventDom = document.createElement('div');
        eventDom.classList.add('event');
        eventDom.style.backgroundColor = event.color;
        eventDom.innerHTML = sanitizeHTML(event.subject);
        eventDom.setAttribute("draggable", "true");

        let iso = dateToISO(event.b);

        let day = this.parent.querySelector('day[data-date="' + iso + '"]');
        if (!day) {
            console.error("Cannot add event", event, event.b.getFullYear());
            return;
        }

        // Stockage sécurisé des données d'événement
        const eventDataStore = new WeakMap();
        eventDataStore.set(eventDom, event);

        // Définir une heure de fin par défaut si manquante
        if (event.e == null) {
            event.e = new Date(event.b.getTime() + HOUR_IN_MS);
        }

        day.querySelector('day-foreground')?.appendChild(eventDom);
    }

    /**
     * Détruit le calendrier et nettoie toutes les ressources
     * @private
     */
    _destroy() {
        this._removeEventListeners();
        this._cleanupTooltips();
        this.parent.innerHTML = "";
    }

    /**
     * Définit manuellement les données d'événements
     * Filtre automatiquement les événements avec des dates invalides
     * 
     * @param {DataCalendarMonth[]} data - Les nouveaux événements
     * 
     * @example
     * ```typescript
     * const events: DataCalendarMonth[] = [
     *     // ... vos événements
     * ];
     * calendar.set_data(events);
     * calendar.render(); // Re-rendre pour afficher les nouveaux événements
     * ```
     */
    set_data(data: DataCalendarMonth[]) {
        this.data = data.filter(item => isValidDate(item.b));
    }

    // ================================
    // MÉTHODES PUBLIQUES - UTILITAIRES
    // ================================

    /**
     * Vide le cache des données
     * Utile pour forcer le rechargement depuis l'API
     * 
     * @example
     * ```typescript
     * calendar.clearCache();
     * await calendar.obtain_datas(); // Rechargera depuis l'API
     * ```
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Récupère l'état de chargement actuel
     * @returns {boolean} True si une requête est en cours
     * 
     * @example
     * ```typescript
     * if (calendar.getLoadingState()) {
     *     console.log("Chargement en cours...");
     * }
     * ```
     */
    getLoadingState(): boolean {
        return this.isLoading;
    }
}