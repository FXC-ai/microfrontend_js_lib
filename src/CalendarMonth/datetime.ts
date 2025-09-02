export const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

/**
 * Retourne la date du lundi de la semaine pour une date donnée.
 * Si la date donnée est un lundi, retourne cette même date.
 *
 * @param date - La date pour laquelle on veut trouver le lundi
 * @returns Une nouvelle date correspondant au lundi de la semaine
 */
export const getMonday = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    return result;
}

/**
 * Retourne la date du dimanche de la semaine pour une date donnée.
 * Si la date donnée est un dimanche, retourne cette même date.
 *
 * @param date - La date pour laquelle on veut trouver le dimanche
 * @returns Une nouvelle date correspondant au dimanche de la semaine
 */
export const getSunday = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() + (day === 0 ? 0 : 7 - day);
    result.setDate(diff);
    return result;
}

export const getLastDateOfMonth = (month: number, year: number): Date => {
    if (month < 0 || month > 11) {
        throw new Error('Le mois doit être compris entre 0 et 11');
    }
    return new Date(year, month + 1, 0);
}

export const getFirstDateOfMonth = (month: number, year: number): Date => {
    if (month < 0 || month > 11) {
        throw new Error('Le mois doit être compris entre 0 et 11');
    }
    return new Date(year, month, 1);
}

export const float2hours = (f: number): string => {
    let hours = Math.floor(f);
    let minutes = Math.floor((f - hours) * 60.0);
    return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
}

export const date2HoursFloat = (d: Date): number => {
    return (d.getHours() + d.getMinutes() / 60.0 + d.getSeconds() / 3600.0);
}

export const makeDateFromISOAndHour = (iso: string, hour: string): Date => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        throw new Error('La date doit être au format YYYY-MM-DD');
    }

    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hour)) {
        throw new Error('L\'heure doit être au format hh:mm (00:00 à 23:59)');
    }

    const [year, month, day] = iso.split('-').map(Number);
    const [hours, minutes] = hour.split(':').map(Number);


    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date;
}

export const dateToISO = (d: Date): string =>
{
    // console.groupCollapsed("dateToISO = ", d);
    const copie = new Date(d.getTime());
    copie.setHours(6);
    return copie.toISOString().slice(0, 10)
}

export interface DateTuple {
    b: Date;
    e: Date;
}

export const calendarMonthlyLimits = (month: number, year: number): DateTuple => {
    return {
        b: getMonday(getFirstDateOfMonth(month, year)),
        e: getSunday(getLastDateOfMonth(month, year)),
    }
}

export const addDays = (date: Date, days: number = 1): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}


export const hourToY = (h: number, b: number, e: number): number => {
    return (h - b) / (e - b);
}

export const percentToHour = (percent: number, b: number, e: number) => {
    return (e - b) * percent + b;
}