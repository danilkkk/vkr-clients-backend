import TelegramBotApi from 'node-telegram-bot-api';
import logger from "../logger.js";
import officesService from "./offices-service.js";
import { getMinutesFromMS, getHoursAndMinutesFromMs, formatDate, splitIntervalByIntervals } from '../utils/time-utils.js'
import usersService from "./users-service.js";
import recordsService from "./records-service.js";
import chatBotService from "./chat-bot-service.js";
import dotenv from 'dotenv';
import authService from "./auth-service.js";
dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN;
const WEB_SITE_URL = process.env.CLIENT_URL;

const CALLBACK_DATA_SEPARATOR = ':';

const OPTIONS = { polling: true };
const UNKNOWN_COMMAND = 'К сожалению, я Вас не понимаю. Введите команду из списка';
const UNKNOWN_ERROR = 'Произошла непредвиденная ошибка. Попробуйте еще раз.';

const INFO_MESSAGE = `Вы можете использовать следующие команды:\n /appointment - чтобы записаться на прием,\n /records - чтобы посмотреть свои предстоящие записи`

const COMMANDS = [
    { command: '/start', description: 'Начать!'},
    { command: '/appointment', description: 'Записаться на прием'},
    { command: '/records', description: 'Посмотреть мои записи'},
    { command: '/bind', description: 'Привязать уже существующий аккаунт'},
    { command: '/temp_password', description: 'Получить временный пароль для входа на сайт'},
];

const CallbackTypes = {
    CANCEL_RECORD: 'cancel_record',
    CANCEL_OPERATION: 'cancel_operation',
    SELECT_OFFICE: 'select_office',
    SELECT_SERVICE: 'select_service',
    SELECT_SPEC: 's_s',
    SELECT_DAY: 'select_day',
    SELECT_TIME: 'select_time',
    CONFIRM_ACTION: 'confirm',
}

const chatsCache = new Map();

class TelegramBotService {
    bot

    constructor() {
        logger.info('[TelegramBotService] initialization...');
        this.bot = new TelegramBotApi(TOKEN, OPTIONS);
        this.bot.setMyCommands(COMMANDS);
        this._handleChat();
    }

    async stopPoling() {
        await this.bot.stopPolling();
    }

    async sendMessage(chatId, message) {
        return await this.bot.sendMessage(chatId, message);
    }

    async _handleChat() {
        this.bot.on('message', async (message) => {
            const { text, chat, from } = message;

            const chatId = chat.id;

            try {
                switch (text) {
                    case '/start':
                        return await this.sendGreeting(chatId, from);

                    case '/appointment':
                        return await this.startAppointment(chatId);

                    case '/records':
                        return await this.sendUserRecords(chatId);

                    case '/bind':
                        return await this.bindExistingAccount(chatId);

                    case '/temp_password':
                        return await this.generateTempPassword(chatId);

                    default:
                        return await this.bot.sendMessage(chatId, UNKNOWN_COMMAND);
                }
            } catch (e) {
                return await this.bot.sendMessage(chatId, UNKNOWN_ERROR);
            }
        });

        this.bot.on('callback_query', async msg => {
            const { first: type, second: value } = parseData(msg.data);
            const chatId = msg.message.chat.id;

            try {
                switch (type) {
                    case CallbackTypes.CANCEL_RECORD:
                        return await this.handleRecordCancelling(chatId, value);

                    case CallbackTypes.CANCEL_OPERATION:
                        return await this.handleOperationCancelling(chatId);

                    case CallbackTypes.SELECT_SERVICE:
                        return await this.handleServiceSelection(chatId, value);

                    case CallbackTypes.SELECT_OFFICE:
                        return await this.handleOfficeSelection(chatId, value);

                    case CallbackTypes.SELECT_SPEC:
                        return await this.handleSpecSelection(chatId, value);

                    case CallbackTypes.SELECT_DAY:
                        return await this.handleDaySelection(chatId, value);

                    case CallbackTypes.SELECT_TIME:
                        return await this.handleTimeSelection(chatId, value);

                    case CallbackTypes.CONFIRM_ACTION:
                        return await this.handleConfirmation(chatId, value);

                    default:
                        logger.error(`Unknown callback type: ${type}`);
                        return await this.bot.sendMessage(chatId, UNKNOWN_COMMAND);
                }
            } catch (e) {
                logger.error(e);
                return await this.bot.sendMessage(chatId, UNKNOWN_ERROR);
            }
        });
    }

    async startAppointment(chatId) {
        const options = await getOfficesButtons();
        return await this.bot.sendMessage(chatId, 'Выберите офис, который Вам будет удобно посетить:', options);
    }

    async sendGreeting(chatId, from) {
        await usersService.registerUserFromTelegram(chatId, from.first_name, from.last_name);
        await this.bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/319/9d0/3199d0a3-cc1e-3cb6-be7d-dfb398b9af88/256/70.webp');
        await this.bot.sendMessage(chatId, getGreetingMessage(from.first_name));
        return await this.bot.sendMessage(chatId, INFO_MESSAGE);
    }

    async bindExistingAccount(chatId) {
        return await this.bot.sendMessage(chatId, `Чтобы привязать существующий аккаунт, зайдите в раздел настроек на нашем сайте <a href="${WEB_SITE_URL}">${WEB_SITE_URL}</a> и укажите следующий идентификатор: ${chatId}`, {parse_mode : "HTML"});
    }

    async generateTempPassword(chatId) {
        const passwordLink = await authService.resetPassword(undefined, undefined, chatId);
        await this.bot.sendMessage(chatId, `Чтобы воспользоваться сайтом, необходим пароль. Чтобы создать новый пароль, перейдите по этой ссылке: <a href="${passwordLink}">${passwordLink}</a>`, {parse_mode : "HTML"});
        await this.bot.sendMessage(chatId, `В дальнейшем для входа в качестве логина используйте следующий идентификатор: ${chatId}`);
        return await this.bot.sendMessage(chatId, `Наш сайт: <a href="${WEB_SITE_URL}">${WEB_SITE_URL}</a>`, {parse_mode : "HTML"});
    }

    async sendUserRecords(chatId) {
        const records = await recordsService.getClientRecordsByTelegramId(chatId);

        if (!records || records.length === 0) {
            return await this.bot.sendMessage(chatId, 'У Вас пока нет предстоящих записей');
        }

        await this.bot.sendMessage(chatId, `Количество предстоящих записей: ${records.length}. Вот они:`);

        for (let i = 0; i < records.length; i++) {
            const button = getButton('Отменить эту запись', CallbackTypes.CANCEL_RECORD, records[i].id);
            const options = formatButtons([[button]]);

            await this.bot.sendMessage(chatId, `#${i + 1}. ${getRecordString(records[i])}`, options);
        }
    }

    async handleConfirmation(chatId) {
        await this.bot.sendMessage(chatId, `Отлично! Будем ждать Вас!`);
        return await this.bot.sendMessage(chatId, INFO_MESSAGE);
    }

    async handleTimeSelection(chatId, startTime) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (!chatInfo || !chatInfo.scheduleId || !chatInfo.serviceId || !chatInfo.officeId ||  !chatInfo.specId) {
            return;
        }

        await chatBotService.clearData(chatId);

        recordsService.createRecordByTelegramId(chatId, chatInfo.serviceId, chatInfo.scheduleId, Number(startTime)).then(async (record) => {
            await this.bot.sendMessage(chatId, `Ура, все готово! Запись успешно создана. Проверьте, пожалуйста:`);
            chatsCache[chatId] = undefined;
            const okButton = getButton('Да, все хорошо', CallbackTypes.CONFIRM_ACTION, record.id);
            const RejectButton = getButton('Хочу отменить эту запись', CallbackTypes.CANCEL_RECORD, record.id);
            const options = formatButtons([[okButton, RejectButton]]);

            await this.bot.sendMessage(chatId, getRecordString(record), options);
        }).catch(async (error) => {
            await this.bot.sendMessage(chatId, `Хмм... Что-то пошло не так: ${error && error.message}`);
            await this.bot.sendMessage(chatId, INFO_MESSAGE);
        })
    }

    async handleDaySelection(chatId, scheduleId) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (chatInfo.scheduleId || !chatInfo.serviceId || !chatInfo.officeId ||  !chatInfo.specId) {
            return;
        }

        await chatBotService.saveDayBySchedule(chatId, scheduleId);

        const { daySchedule, serviceDuration } = await recordsService.getAvailableTimeIntervalsForServiceByScheduleId(chatInfo.specId, chatInfo.serviceId, scheduleId, Date.now() + 1000 * 60);

        if (!daySchedule || !daySchedule.freeIntervals || daySchedule.freeIntervals.length === 0) {
            const options = await getFreeDaysButtons(chatInfo.specId, chatInfo.serviceId);
            if (options) {
                return await this.bot.sendMessage(chatId, 'К сожалению, в этот день у мастера нет свободного времени. Попробуйте выбрать другую дату:', options);
            }
        }

        const options = await getFreTimeButtons(daySchedule.freeIntervals, serviceDuration);
        await this.bot.sendMessage(chatId, 'Можете выбрать любое подходящее для Вас время в этот день:', options);
    }

    async handleSpecSelection(chatId, specId) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (!chatInfo || chatInfo.specId || !chatInfo.serviceId || !chatInfo.officeId) {
            return;
        }

        await chatBotService.saveSpecialist(chatId, specId);

        const options = await getFreeDaysButtons(specId, chatInfo.serviceId);
        if (options) {
            return await this.bot.sendMessage(chatId, 'Почти готово! Осталось только определиться со временем. Начнем с подходящей даты:', options);
        }

        await this.bot.sendMessage(chatId, 'К сожалению, у мастера пока нет свободного времени');
    }

    async handleOfficeSelection(chatId, officeId) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (chatInfo && chatInfo.officeId) {
            return;
        }

        await chatBotService.saveOffice(chatId, officeId);

        const options = await getServicesButtons(officeId);
        await this.bot.sendMessage(chatId, 'Отлично! Давайте теперь определимся с услугой:', options);
    }

    async handleServiceSelection(chatId, serviceId) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (!chatInfo || chatInfo.serviceId || !chatInfo.officeId) {
            return;
        }

        await chatBotService.saveService(chatId, serviceId);

        const options = await getSpecButtons(serviceId);

        await this.bot.sendMessage(chatId, 'К какому специалисту Вам бы хотелось обратиться?', options);
    }

    async handleOperationCancelling(chatId) {
        await chatBotService.clearData(chatId);
        return await this.bot.sendMessage(chatId, INFO_MESSAGE);
    }

    async handleRecordCancelling(chatId, recordId) {
        recordsService.deleteRecordByIdByBot(recordId).then(async () => {
            await this.bot.sendMessage(chatId, 'Запись успешно отменена. Хотите записаться еще раз?');
            return this.bot.sendMessage(chatId, INFO_MESSAGE);
        })
    }
}

async function getSpecButtons(serviceId) {
    const specialists = await usersService.getSpecialistsByService(serviceId);

    const preparedData = specialists.map(({ id, name, surname }) => ({
        text: `${name} ${surname}`,
        type: CallbackTypes.SELECT_SPEC,
        info: `${id}`,
    }))

    return getButtonsWithCancelButton(preparedData);
}

async function getFreTimeButtons(intervals, serviceDuration) {
    const smallIntervals = intervals.map(interval => splitIntervalByIntervals(interval.from, interval.to, serviceDuration)).flat();

    const preparedData = smallIntervals.map(({ str, ms }) => ({
        text: str,
        type: CallbackTypes.SELECT_TIME,
        info: ms,
    }))

    const buttons = getButtons(preparedData);
    const buttonsGrid = getButtonsGrid(buttons, 3);
    return formatButtons(buttonsGrid);
}

async function getFreeDaysButtons(specId, serviceId) {
    const { days } = await recordsService.getAvailableDaysForService(specId, serviceId, Date.now() + 1000 * 60);

    if (!days || days.length === 0) {
        return;
    }

    const preparedData = days.map(({ id, date }) => ({
        text: formatDate(date),
        info: id,
        type: CallbackTypes.SELECT_DAY
    }))

    const buttons = getButtons(preparedData);
    const buttonsGrid = getButtonsGrid(buttons, 3);
    return formatButtons(buttonsGrid);
}

function getButtonsGrid(buttons, itemsInRow = 3) {
    const buttonsGrid = [];

    for (let i = 0; i < buttons.length; i++) {
        const row = Math.floor( i / itemsInRow);
        if (!buttonsGrid[row]) {
            buttonsGrid[row] = [];
        }

        buttonsGrid[row].push(buttons[i]);
    }

    return buttonsGrid;
}

async function getServicesButtons(officeId) {
    const services = await officesService.getServicesByOffice(officeId);

    const preparedData = services.map(({ name, id, info, cost, duration }) => ({
        text: `${name}, ${cost}₽, ~${Math.floor(getMinutesFromMS(duration))} минут`,
        type: CallbackTypes.SELECT_SERVICE,
        info: id,
    }))

    return getButtonsWithCancelButton(preparedData);
}

async function getOfficesButtons() {
    const offices = await officesService.getAllOffices();

    const preparedData = offices.map(office => ({
        text: `${office.name}, ${office.address}`,
        type: CallbackTypes.SELECT_OFFICE,
        info: office.id,
    }));

    return getButtonsWithCancelButton(preparedData);
}

function getGreetingMessage(firstname) {
    return `Здравствуйте, ${firstname}! С моей помощью Вы можете записаться на прием к специалисту в городе Россошь`;
}

function parseData(data) {
    const indexOfSeparator = data.indexOf(CALLBACK_DATA_SEPARATOR);
    return {
        first: data.substring(0, indexOfSeparator),
        second: data.substring(indexOfSeparator + 1),
    }
}

function getButtonsWithCancelButton(preparedData) {
    const buttons = getButtons(preparedData);
    addCancelButton(buttons);
    const buttonsGrid = buttons.map(btn => [btn]);
    return formatButtons(buttonsGrid);
}

function formatButtons(buttons) {
    return {
        reply_markup: JSON.stringify({
            inline_keyboard: buttons
        })
    }

}

function getButtons(dataArray) {
    return dataArray.map(({ text, type, info }) => getButton(text, type, info))
}

function getButton(text, type, info) {
    return {
        text,
        callback_data: `${type}${CALLBACK_DATA_SEPARATOR}${info}`,
    }
}

function addCancelButton(buttons) {
    buttons.push(getButton('Отмена', CallbackTypes.CANCEL_OPERATION, ''))
}

function getRecordString(record) {
   return  `Вы записаны на «${record.service.name}» ${formatDate(record.date, true)} в ${getHoursAndMinutesFromMs(record.startTime)} к мастеру ${record.specialist.name} ${record.specialist.surname}. Стоимость услуги ${record.service.cost}₽, длительность ~${Math.floor(getMinutesFromMS(record.service.duration))} минут.`;
}

export default new TelegramBotService();