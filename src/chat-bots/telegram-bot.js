import TelegramBotApi from 'node-telegram-bot-api';
import logger from "../logger.js";
import { getMinutesFromMS, formatDate } from '../utils/time-utils.js'
import dotenv from 'dotenv';
import chatBotService, { Messengers } from "../services/chat-bot-service.js";
dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN;

const CALLBACK_DATA_SEPARATOR = ':';

const OPTIONS = { polling: true };
const HTML_MESSAGE_OPTION = { parse_mode : 'HTML' };
const UNKNOWN_COMMAND = 'К сожалению, я Вас не понимаю. Введите команду из списка';

const INFO_MESSAGE = `Вы можете использовать следующие команды:
/appointment - чтобы записаться на прием,
/records - чтобы посмотреть свои предстоящие записи,
/bind - чтобы привязать уже существующий аккаунт,
/reset_password - чтобы сбросить пароль для входа на сайт`;

const COMMANDS = [
    { command: '/start', description: 'Начать!'},
    { command: '/appointment', description: 'Записаться на прием'},
    { command: '/records', description: 'Посмотреть мои записи'},
    { command: '/bind', description: 'Привязать уже существующий аккаунт'},
    { command: '/reset_password', description: 'Сбросить пароль для входа на сайт'},
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

class TelegramBot {
    bot

    constructor() {
        logger.info('[TelegramBot] initialization...');
        this.bot = new TelegramBotApi(TOKEN, OPTIONS);
        this.bot.setMyCommands(COMMANDS);
        this._handleChat();
    }

    async stopPoling() {
        await this.bot.stopPolling();
    }

    async sendMessage(chatId, message, options) {
        return await this.bot.sendMessage(chatId, message, options);
    }

    async sendHTMLMessage(chatId, message) {
        return await this.bot.sendMessage(chatId, message, HTML_MESSAGE_OPTION);
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
                    case '/reset_password':
                        return await this.generateTempPassword(chatId);
                    default:
                        return await this.sendMessage(chatId, UNKNOWN_COMMAND);
                }
            } catch (error) {
                logger.error(error);
                await this.sendErrorMessage(chatId, error);
                return this.sendMessage(chatId, INFO_MESSAGE);
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
            } catch (error) {
                logger.error(error);
                await this.sendErrorMessage(chatId, error);
                return this.sendMessage(chatId, INFO_MESSAGE);
            }
        });
    }

    async startAppointment(chatId) {
        await chatBotService.clearData(chatId);
        const options = await getOfficesButtons();
        return await this.sendMessage(chatId, 'Выберите офис, который Вам будет удобно посетить:', options);
    }

    async sendGreeting(chatId, from) {
        await chatBotService.registerUserFromChatBot(Messengers.TELEGRAM, chatId, from.first_name, from.last_name);
        await this.bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/319/9d0/3199d0a3-cc1e-3cb6-be7d-dfb398b9af88/256/70.webp');
        await this.sendMessage(chatId, getGreetingMessage(from.first_name));
        return await this.sendMessage(chatId, INFO_MESSAGE);
    }

    async bindExistingAccount(chatId) {
        return await this.sendHTMLMessage(chatId, await chatBotService.getTelegramCode(chatId));
    }

    async generateTempPassword(chatId) {
       const messages = await chatBotService.getMessagesWithResetPasswordLink(chatId);

       messages.forEach(async (message) => {
            await this.sendHTMLMessage(chatId, message);
        });
    }

    async sendUserRecords(chatId) {
        const records = await chatBotService.getClientRecords(Messengers.TELEGRAM, chatId);

        if (!records || records.length === 0) {
            return await this.sendMessage(chatId, 'У Вас пока нет предстоящих записей');
        }

        await this.sendMessage(chatId, `Количество предстоящих записей: ${records.length}. Вот они:`);

        for (let i = 0; i < records.length; i++) {
            const button = getButton('Отменить эту запись', CallbackTypes.CANCEL_RECORD, records[i].id);
            const options = formatButtons([[button]]);

            await this.sendMessage(chatId, `#${i + 1}. ${chatBotService.getRecordString(records[i])}`, options);
        }
    }

    async handleConfirmation(chatId) {
        await this.sendMessage(chatId, `Отлично! Будем ждать Вас!`);
        return await this.sendMessage(chatId, INFO_MESSAGE);
    }

    async handleTimeSelection(chatId, startTime) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (!chatInfo || !chatInfo.scheduleId || !chatInfo.serviceId || !chatInfo.officeId ||  !chatInfo.specId) {
            return;
        }

        await chatBotService.clearData(chatId);

        const record = await chatBotService.createRecord(Messengers.TELEGRAM, chatId, chatInfo.serviceId, chatInfo.scheduleId, startTime);

        await this.sendMessage(chatId, `Ура, все готово! Запись успешно создана. Проверьте, пожалуйста:`);

        const okButton = getButton('Да, все хорошо', CallbackTypes.CONFIRM_ACTION, record.id);
        const RejectButton = getButton('Хочу отменить эту запись', CallbackTypes.CANCEL_RECORD, record.id);
        const options = formatButtons([[okButton, RejectButton]]);
        await this.sendMessage(chatId, chatBotService.getRecordString(record), options);
    }

    async handleDaySelection(chatId, scheduleId) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (chatInfo.scheduleId || !chatInfo.serviceId || !chatInfo.officeId ||  !chatInfo.specId) {
            return;
        }

        await chatBotService.saveDayBySchedule(chatId, scheduleId);

        const { freeTime, serviceDuration } = await chatBotService.getFreeTime(chatInfo.specId, chatInfo.serviceId, scheduleId);

        if (!freeTime) {
            const options = await getFreeDaysButtons(chatInfo.specId, chatInfo.serviceId);

            if (options) {
                return await this.sendMessage(chatId, 'К сожалению, в этот день у мастера нет свободного времени. Попробуйте выбрать другую дату:', options);
            }
        }

        const options = getFreTimeButtons(freeTime, serviceDuration);

        await this.sendMessage(chatId, 'Можете выбрать любое подходящее для Вас время в этот день:', options);
    }

    async handleSpecSelection(chatId, specId) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (!chatInfo || chatInfo.specId || !chatInfo.serviceId || !chatInfo.officeId) {
            return;
        }

        await chatBotService.saveSpecialist(chatId, specId);

        const options = await getFreeDaysButtons(specId, chatInfo.serviceId);

        if (options) {
            return await this.sendMessage(chatId, 'Почти готово! Осталось только определиться со временем. Начнем с подходящей даты:', options);
        }

        await this.sendMessage(chatId, 'К сожалению, у мастера пока нет свободного времени');
    }

    async handleOfficeSelection(chatId, officeId) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (chatInfo && chatInfo.officeId) {
            return;
        }

        await chatBotService.saveOffice(chatId, officeId);

        const options = await getServicesButtons(officeId);
        await this.sendMessage(chatId, 'Отлично! Давайте теперь определимся с услугой:', options);
    }

    async handleServiceSelection(chatId, serviceId) {
        const chatInfo = await chatBotService.getChatInfo(chatId);

        if (!chatInfo || chatInfo.serviceId || !chatInfo.officeId) {
            return;
        }

        await chatBotService.saveService(chatId, serviceId);

        const options = await getSpecButtons(serviceId);

        await this.sendMessage(chatId, 'К какому специалисту Вам бы хотелось обратиться?', options);
    }

    async handleOperationCancelling(chatId) {
        await chatBotService.clearData(chatId);
        return await this.sendMessage(chatId, INFO_MESSAGE);
    }

    async handleRecordCancelling(chatId, recordId) {
        await chatBotService.deleteRecord(Messengers.TELEGRAM, recordId);
        await this.sendMessage(chatId, 'Запись успешно отменена. Хотите записаться еще раз?');
        return this.sendMessage(chatId, INFO_MESSAGE);
    }

    async sendErrorMessage(chatId, error) {
        await this.sendMessage(chatId, `Хмм... Что-то пошло не так: ${error && error.message}`);
    }
}

async function getSpecButtons(serviceId) {
    const specialists = await chatBotService.getSpecialistsByService(serviceId);

    const preparedData = specialists.map(({ id, name, surname }) => ({
        text: `${name} ${surname}`,
        type: CallbackTypes.SELECT_SPEC,
        info: `${id}`,
    }))

    return getButtonsWithCancelButton(preparedData);
}

function getFreTimeButtons(freeTime) {
    const preparedData = freeTime.map(({ str, ms }) => ({
        text: str,
        type: CallbackTypes.SELECT_TIME,
        info: ms,
    }))

    const buttons = getButtons(preparedData);
    const buttonsGrid = getButtonsGrid(buttons, 3);
    addCancelButton(buttonsGrid, true);

    return formatButtons(buttonsGrid);
}

async function getFreeDaysButtons(specId, serviceId) {
    const days  = await chatBotService.getAvailableDaysForService(specId, serviceId);

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

    addCancelButton(buttonsGrid, true);

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
    const services = await chatBotService.getServicesByOffice(officeId);

    const preparedData = services.map(({ name, id, cost, duration }) => ({
        text: `${name}, ${cost}₽, ~${Math.floor(getMinutesFromMS(duration))} минут`,
        type: CallbackTypes.SELECT_SERVICE,
        info: id,
    }))

    return getButtonsWithCancelButton(preparedData);
}

async function getOfficesButtons() {
    const offices = await chatBotService.getOffices();

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

function addCancelButton(buttons, separately = false) {
    const cancelButton = getButton('Отмена', CallbackTypes.CANCEL_OPERATION, '');
    buttons.push(separately ? [cancelButton] : cancelButton);
}

export default new TelegramBot();