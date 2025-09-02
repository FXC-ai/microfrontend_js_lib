
import { hourToY } from "./datetime";

export class CalendarEvent
{
    public b: Date;
    public e?: Date;
    public all_day?: boolean;
    public subject: string;
    public color: string;

    constructor() {}
}

export const setCSSTop = (d: HTMLElement, n: number) => {
    d.style.top = `calc(100% * ${n})`;
}

export const setCSSDuree = (d: HTMLElement, elem_b: number, elem_e: number, b: number, e: number) => {
    let top = (elem_b - b) / (e - b);
    let bottom = top + 0.09;
    // console.log ("top = ", top, "bottom = ", bottom);
    d.style.top = `calc(100% * ${top})`;
    d.style.bottom = `calc(100% - (100% * ${bottom}))`;
}
