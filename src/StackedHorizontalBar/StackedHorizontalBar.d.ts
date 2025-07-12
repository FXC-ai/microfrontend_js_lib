import { UIElement } from '../UIElement';

export interface DataStackedHorizontalBar
{
    label: string;
    category: string;
    color: string;
    description: string;
    value: number;
}

export class StackedHorizontalBar extends UIElement
{
    datas: Array<DataStackedHorizontalBar>;
    prefixeAPI: string;

    constructor
    (
        prefixeAPI : string,
        parent : HTMLElement | null,
    );

    obtain_datas(): Promise<void>;
    render(): void;
    destroy(): void;

    set_datas(datas: Array<DataStackedHorizontalBar>): void;
    set_prefixeAPI(prefixeAPI: string): void;
}