/**
 * Crée un élément DOM représentant un tooltip personnalisé.
 * @returns {HTMLElement} Le tooltip HTML.
 */
function createTooltip(): HTMLElement {
    let tooltip = document.createElement("div");
    tooltip.classList.add("dataframe-tooltip");
    return tooltip;
}

/**
 * Classe représentant un tableau interactif avec affichage dynamique et infobulles.
 */
export class Dataframe
{
    parent: HTMLElement;
    prefixeAPI: string;
    data: Array<Record<string, string>> = [];
    isLoading: boolean = false;
    columnNames?: Array<string>;

    private eventListeners: Array<{ element: Element; event: string; handler: EventListener }> = [];
    private activeTooltip: HTMLElement | null = null;

    /**
     * Constructeur de la classe Dataframe.
     * @param prefixeAPI - Le préfixe d'URL pour récupérer les données via fetch.
     * @param parent - L’élément HTML parent où afficher le tableau.
     * @param columnNames - (Optionnel) Liste des noms de colonnes à afficher. Permet de choisir l'ordre d'affichage des colonnes.
     */
    constructor(prefixeAPI: string, parent: HTMLElement, columnNames?: Array<string>)
    {
        this.parent = parent;
        this.prefixeAPI = prefixeAPI;
        this.columnNames = columnNames;
    }

    /**
     * Récupère les données depuis l’API spécifiée par le préfixe.
     * Met à jour la propriété `data`.
     */
    async obtain_datas(): Promise<void>
    {
        if (this.isLoading) return;
        this.isLoading = true;
        this.data = [];
        try
        {
            const url = `/${this.prefixeAPI}`;
            const response = await fetch(url);
            if (!response.ok)
            {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const rawData = await response.json();
            this.data = rawData;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async post_datas(data: Array<Record<string, string>>): Promise<void>
    {
        if (this.isLoading) return;
        this.isLoading = true;
        try {
            const url = `/${this.prefixeAPI}`;
            const response = await fetch
            (
                url, 
                {
                    method: 'POST',
                    headers:
                    {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }
            );
            if (!response.ok)
            {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const result = await response.json();
        }
        catch (error)
        {
            console.error('Erreur lors de l’envoi des données:', error);
        }
        finally
        {
            this.isLoading = false;
        }
    }

    /**
     * Affiche les données sous forme de tableau HTML dans l’élément parent.
     * Calcule dynamiquement les largeurs de colonnes.
     */
    render(): void
    {
        this.parent.innerHTML = "";

        const mainContainer = document.createElement("div");

        mainContainer.style.width = this.parent.clientWidth + "px";

        if (this.parent.clientHeight == 0)
        {
            if (this.data.length * 90 > 512)
            {
                mainContainer.style.height = 512 + "px";
            }
            else
            {
                mainContainer.style.height =  this.data.length * 90 + "px"; // min-width definie dans le css
            }
        }
        else
        {
            mainContainer.style.height = this.parent.clientHeight + "px";
        }

        mainContainer.style.overflowY = "scroll";

        if (!this.columnNames && this.data.length > 0)
        {
            this.columnNames = Object.keys(this.data[0]);
        }

        const columnLengths = this._calculateColumnLengths();

        const columnWidthPct = this._calculateColumnPercents(columnLengths);

        const table = this._createTable(columnWidthPct);

        mainContainer.appendChild(table);

        this.parent.appendChild(mainContainer);
    }

    /**
     * Crée un tableau HTML avec en-têtes et lignes de données.
     * @param columnWidthPct - Carte des largeurs de colonnes en pourcentage.
     * @returns {HTMLTableElement} Le tableau HTML.
     */
    _createTable(columnWidthPct: Map<string, number>): HTMLTableElement
    {
        let table = document.createElement("table");
        table.classList.add("dataframe-table");
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        thead.appendChild(headerRow);
        const tbody = document.createElement("tbody");

        if (this.columnNames)
        {
            for (const columnName of this.columnNames)
            {
                const th = document.createElement("th");
                th.style.width = columnWidthPct.get(columnName) + "%";
                th.textContent = columnName;
                headerRow.appendChild(th);
            }

            for (const row of this.data)
            {
                const tr = document.createElement("tr");
                this._setupTooltipInteraction(tr, row);
                for (const columnName of this.columnNames)
                {
                    const td = document.createElement("td");
                    td.textContent = row[columnName] ?? "";
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    /**
     * Calcule la proportion de largeur de chaque colonne en fonction des longueurs de contenu.
     * @param columnLengths - Longueur maximale pour chaque colonne.
     * @returns {Map<string, number>} Largeur en pourcentage pour chaque colonne.
     */
    _calculateColumnPercents(columnLengths: Map<string, number>): Map<string, number> {
        const totalLength = Array.from(columnLengths.values()).reduce((sum, val) => sum + val, 0);
        return new Map(
            Array.from(columnLengths.entries()).map(([key, length]) => [key, (length / totalLength) * 100])
        );
    }

    /**
     * Calcule les longueurs maximales de chaque colonne pour ajuster les largeurs.
     * @returns {Map<string, number>} Longueur maximale trouvée par colonne.
     */
    _calculateColumnLengths(): Map<string, number> {
        const columnLengths = new Map<string, number>();
        for (const row of this.data) {
            for (const [k, v] of Object.entries(row)) {
                const totalLength = Math.max(k.length, v?.length || 0);
                const currentMax = columnLengths.get(k) || 0;
                columnLengths.set(k, Math.max(currentMax, totalLength));
            }
        }
        return columnLengths;
    }

    /**
     * Attache un gestionnaire d’événement de clic pour afficher un tooltip détaillé.
     * @param eventDom - L’élément cible du clic (ligne du tableau).
     * @param dataToDisplay - Données à afficher dans l’infobulle.
     */
    _setupTooltipInteraction(eventDom: HTMLElement, dataToDisplay: Record<string, string>): void {
        const clickHandler = () => {
            this._cleanupTooltips();

            const tooltip = createTooltip();
            this.activeTooltip = tooltip;

            const tooltipContent = document.createElement("div");
            tooltipContent.classList.add("dataframe-tooltip-content");

            const tooltipTable = document.createElement("table");
            tooltipTable.classList.add("table-dataframe-tooltip-content");

            const tooltipTableTbody = document.createElement("tbody");
            tooltipTable.appendChild(tooltipTableTbody);
            tooltipContent.appendChild(tooltipTable);

            if (this.columnNames) {
                for (const columnName of this.columnNames) {
                    const row = document.createElement("tr");

                    const keyCell = document.createElement("td");
                    keyCell.textContent = columnName;
                    keyCell.style.color = "#8888fe";

                    const valueCell = document.createElement("td");
                    valueCell.innerHTML = dataToDisplay[columnName] ?? "";

                    row.appendChild(keyCell);
                    row.appendChild(valueCell);
                    tooltipTableTbody.appendChild(row);
                }
            }

            tooltip.appendChild(tooltipContent);
            document.body.appendChild(tooltip);

            tooltip.addEventListener("click", () => this._cleanupTooltips());
        };

        this._addEventListener(eventDom, "click", clickHandler);
    }

    /**
     * Ajoute un gestionnaire d’événement à un élément DOM et le conserve pour nettoyage ultérieur.
     * @param element - Élément cible.
     * @param event - Type d’événement.
     * @param handler - Fonction gestionnaire.
     */
    private _addEventListener(element: Element, event: string, handler: EventListener): void {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * Supprime l’infobulle active du DOM.
     */
    private _cleanupTooltips(): void {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }
    }

    /**
     * Nettoie les événements et les infobulles. À appeler lors de la destruction de l’objet.
     */
    destroy(): void {
        for (const { element, event, handler } of this.eventListeners) {
            element.removeEventListener(event, handler);
        }
        this.eventListeners = [];
        this._cleanupTooltips();
    }

    /**
     * Définit manuellement les données à afficher dans le tableau.
     * @param data - Données sous forme de tableau d’objets clé/valeur.
     */
    set_data(data: Array<Record<string, string>>): void {
        this.data = data;
    }
}
