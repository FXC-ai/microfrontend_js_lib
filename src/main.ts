import { CalendarDensity } from './d3CalendarDensity/CalendarDensity.js';


// Test simple
const container = document.getElementById('chart-container');
if (container)
{
    console.log('Container for anniversaries found:', container);

    const calendar = new CalendarDensity
    (
        2023,
        'lien/vers/le/back',
        container as HTMLElement
    );
    (async () => {
        await calendar.obtain_datas_by_year();
        calendar.render();
    })();
}

const container_anniv = document.getElementById('chart-container-anniv');
if (container_anniv)
{
    console.log('Container for anniversaries found:', container_anniv);
    const calendar_anniv = new CalendarDensity
    (
        2025,
        'lien/vers/le/back',
        container_anniv as HTMLElement
    );
    (async () => {
        await calendar_anniv.obtain_datas_by_year();
        calendar_anniv.render();
    })();
}