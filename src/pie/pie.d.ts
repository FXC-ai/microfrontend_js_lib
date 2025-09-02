import { UIElement } from "../UIElement";

export interface DataPie {
    label: string;        // Catégorie ou nom de la portion (affiché dans la légende ou sur le graphique).
    color: string;        // Couleur associée à chaque portion du graphique circulaire (code hexadécimal).
    value: number;       // Valeur numérique représentant la taille relative de la portion.
    description?: string; // Texte affiché dans l’infobulle (tooltip) au survol de la portion.
}

export class Pie extends UIElement
{
    datas: Array<DataPie>; 
    protected prefixeAPI: string;

    constructor(prefixeAPI: string, parent: HTMLElement | null);

    obtain_datas(): Promise<void>;
    render(): void;
    destroy(): void;

    set_datas(datas: Array<DataPie>): void;
    set_prefixeAPI(prefixeAPI: string): void;
}

