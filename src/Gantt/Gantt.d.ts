import { UIElement } from '../UIElement';

export interface DataGantt
{
    label : string;
    category : string;
    color : string;
    description : string;
    startdatetime : Date;
    enddatetime : Date;
}

export class Gantt extends UIElement
{
    datas: Array<DataGantt>;
    prefixeAPI: string;

    constructor
    (
        prefixeAPI : string,
        parent : HTMLElement | null,
    );

    obtain_datas(): Promise<void>;
    render(): void;
    destroy(): void;

    set_datas(datas: Array<DataGantt>): void;
    set_prefixeAPI(prefixeAPI: string): void;

}

