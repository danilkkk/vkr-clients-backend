import cron from 'node-cron';
import recordsService from "./records-service.js";
import { dateToString, formatDate, getHoursAndMinutesFromMs, getTomorrow, getMinutesFromMS} from "../utils/time-utils.js";
import mailService from "./mail-service.js";
import telegramBotService from "./telegram-bot-service.js";
import RecordDto from "../dtos/record-dto.js";
import logger from "../logger.js";

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

        logger.info(`sent notification to ${client.name}  ${client.surname} by ${client.telegramId ? 'telegram' : 'email'} ${client.telegramId || client.email}`);

        if (client.telegramId) {
            return await telegramBotService.sendHTMLMessage(client.telegramId, message);
        }

        if (client.email) {
            return await mailService.sendMail(client.email, 'Напоминание о записи', message);
        }
    } catch (e) {
        logger.error(e);
    }
}

const CHUNK_SIZE = 5;

const task = async () => {
    const tomorrow = dateToString(getTomorrow());

    const cursor = await recordsService.getRecordsCursor();

    console.log(cursor);

    const taskInstance = async () => {
        for (let i = 0; i < CHUNK_SIZE; i++) {
            try {
                const record = await cursor.next();

                if (!record) {
                    return;
                }

                if (record.scheduleId.date === tomorrow) {
                    await sendNotification(RecordDto.Convert(record));
                }
            } catch (e) {
                logger.error(e);
            }
        }

        setImmediate(taskInstance);
    }

    taskInstance();
}

export default function startNotify() {
    cron.schedule(EVERY_DAY_AT_16_00, task);
}