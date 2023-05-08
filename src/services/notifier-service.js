import cron from 'node-cron';
import recordsService from "./records-service.js";
import { dateToString, formatDate, getHoursAndMinutesFromMs, getTomorrow, getMinutesFromMS} from "../utils/time-utils.js";
import mailService from "./mail-service.js";
import telegramBotService from "./telegram-bot-service.js";

const EVERY_DAY_AT_16_00 = '0 00 16 * * *';

const getHTMLMessage = (client, specialist, service, cost, startTime, duration, date) => {
    return `
<b>${client.name}!</b>\n
Напоминаем Вам о том, что Вы записаны на завтра ${formatDate(date)} в ${getHoursAndMinutesFromMs(startTime)} к мастеру ${specialist.name || ''} ${specialist.surname || ''} на «${service.name}».\n
Стоимость услуги ${service.cost}₽, длительность ~${Math.floor(getMinutesFromMS(service.duration))} минут.
\n
<i>Будем ждать Вас!</i>`
}

const sendNotification = async ({ client, specialist, service, cost, startTime, duration, date }) => {
    try {
        const message = getHTMLMessage( client, specialist, service, cost, startTime, duration, date);

        if (client.telegramId) {
            return await telegramBotService.sendHTMLMessage(client.telegramId, message);
        }

        if (client.email) {
            return await mailService.sendMail(client.email, 'Напоминание о записи', message);
        }
    } catch (e) {
        console.log(e);
    }
}

const task = async () => {
    const tomorrow = dateToString(getTomorrow());
    console.log(tomorrow);
    await recordsService.getRecordsOnDate(tomorrow, sendNotification);
}

export default function startNotify() {
    cron.schedule(EVERY_DAY_AT_16_00, task);
}