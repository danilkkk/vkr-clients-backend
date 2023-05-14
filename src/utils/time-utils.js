import moment from "moment";

const DAY_MS = 1000 * 60 * 60 * 24;

export function getDateStringsFromInterval(from, to) {
    from = getInitialDateOfDay(from);
    to = getInitialDateOfDay(to);

    let current = from;
    const dates = [];

    do {
        dates.push(dateToString(current));
        current += DAY_MS;
    } while (current <= to)

    return dates;
}

export function dateToString(date) {
    return moment(Number(date)).format('YYYY-MM-DD');
}

export function stringToMillis(dateString) {
    return Date.parse(dateString);
}

export function getInitialDateOfDay(date) {
    return stringToMillis(dateToString(date));
}

export function getMinutesFromMS(ms) {
    return ms / 1000 / 60;
}

export function getHoursAndMinutesFromMs(ms) {
    const date = new Date(ms);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatDate(dateString, withYear = false) {
    const date = new Date(Date.parse(dateString));
    return moment(date).locale("ru").format(`D MMMM ${withYear ? 'YYYY' : ''}`);
}

export function splitIntervalByIntervals(from, to, minLength, step = 1000 * 60 * 10 /* 10 минут */) {
    const rightBound = to - minLength;

    let startTime = from;

    const times = [];

    while (startTime < rightBound) {
        times.push({
            str: getHoursAndMinutesFromMs(startTime),
            ms: startTime,
        })

        startTime += step;
    }

    return times;
}

export function getTomorrow() {
    return moment(Date.now()).add(1, 'day');
}
