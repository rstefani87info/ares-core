import moment from 'moment-timezone';

export function parse(date, format=undefined, timezone=undefined) {
    if(!date) return null;
    if(date instanceof Date) return date;
    if(typeof date === 'string'){
        return timezone? moment(date, format) : moment.tz(date, format, timezone);
    }
}

export function formatDateOrTime(date, format, fromFormat=undefined) {
    return moment(parse(date,fromFormat))?.format(format);
}

export function changeTimeZone(date, fromTimeZone, toTimeZone='UTC', fromFormat=undefined, toFormat=undefined)
{
    let newMoment =  parse(date,fromFormat,fromTimeZone);
    newMoment = newMoment.tz(toTimeZone);
    if(!toFormat) return newMoment.format(toFormat); 
    return newMoment;
}

export function sumSeconds(date, seconds, fromFormat=undefined) {
    const newMoment = moment(parse(date,fromFormat));
    return newMoment?.add(seconds, 'seconds');
}
export function sumMilliseconds(date, milliseconds, fromFormat=undefined) {
    const newMoment = moment(parse(date,fromFormat));
    return newMoment?.add(milliseconds, 'milliseconds');
}

export function sumMinutes(date, minutes, fromFormat=undefined) {
    const newMoment = moment(parse(date,fromFormat));
    return newMoment?.add(minutes, 'minutes');
}

export function sumHours(date, hours, fromFormat=undefined) {
    const newMoment = moment(parse(date,fromFormat));
    return newMoment?.add(hours, 'hours');
}

export function sumDays(date, days, fromFormat=undefined) {
    const newMoment = moment(parse(date,fromFormat));
    return newMoment?.add(days, 'days');
}

export function sumMonths(date, months, fromFormat=undefined) {
    const newMoment = moment(parse(date,fromFormat));
    return newMoment?.add(months, 'months');
}

export function sumYears(date, years, fromFormat=undefined) {
    const newMoment = moment(parse(date,fromFormat));
    return newMoment?.add(years, 'years');
}
