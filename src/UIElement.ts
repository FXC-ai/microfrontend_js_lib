export abstract class UIElement
{
    protected prefixeAPI: string;
    protected parent: HTMLElement;

    constructor(prefixeAPI: string, parent: HTMLElement) {
        this.prefixeAPI = prefixeAPI;
        this.parent = parent;
    }

    abstract obtain_datas() : Promise<void>;
    abstract render(): void;
    abstract destroy(): void;
}