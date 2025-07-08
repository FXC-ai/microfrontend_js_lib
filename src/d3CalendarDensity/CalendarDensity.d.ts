import { UIElement } from '../UIElement';

export interface DataCalendarDensity
{
    date : Date;
    description : string;
    value : number;
    label : string;
}

export class CalendarDensity extends UIElement
{
    datas: Array<DataCalendarDensity>;
    year: number;

    constructor (year : number, prefixeAPI : string, parent : HTMLElement)
    obtain_datas(): Promise<void>;
    render(): void;
    destroy(): void;

    set_datas(datas: Array<DataCalendarDensity>): void;
    set_year(year: number): void;
    
    obtain_datas_by_year(): Promise<void>;
    next_year(): void;
    previous_year(): void;
}
