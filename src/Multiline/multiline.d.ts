import { UIElement } from '../UIElement';


export interface DataMultiline
{
    label: string;        // Identifiant de la série ou courbe à laquelle appartient la valeur
    color: string;        // Couleur associée à la ligne (code couleur CSS ou hexadécimal)
    date: Date;           // Date utilisée pour l’axe des abscisses (X)
    value: number;       // Valeur numérique positive associée à la date
    description?: string; // Description facultative de la donnée (ex. pour les infobulles)
}

export class Multiline extends UIElement
{
    datas: Array<DataMultiline>; 
    protected prefixeAPI: string;

    constructor
    (
        prefixeAPI: string,
        parent: HTMLElement | null,
    )

    obtain_datas(): Promise<void>;
    render(): void;
    destroy(): void;

    set_datas(datas: Array<DataMultiline>): void;
    set_prefixeAPI(prefixeAPI: string): void;

}