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
    return moment(date).format('YYYY-MM-DD');
}

export function stringToMillis(dateString) {
    return Date.parse(dateString);
}

export function getInitialDateOfDay(date) {
    return stringToMillis(dateToString(date));
}
