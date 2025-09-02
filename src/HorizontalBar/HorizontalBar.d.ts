import { UIElement } from '../UIElement';

export interface DataHorizontalBar
{
    label: string;
    color: string;
    value: number;
    description?: string;
}

export class HorizontalBar extends UIElement
{
    datas: Array<DataHorizontalBar>;
    prefixeAPI: string;

    constructor(prefixeAPI: string, parent: HTMLElement | null);

    obtain_datas(): Promise<void>;
    render(): void;
    destroy(): void;

    set_datas(datas: Array<DataHorizontalBar>): void;
    set_prefixeAPI(prefixeAPI: string): void;
}