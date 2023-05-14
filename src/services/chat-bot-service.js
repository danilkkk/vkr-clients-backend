import chatBotModel from "../models/chat-bot-model.js";
import ChatInfoDto from "../dtos/chat-info-dto.js";
import officesService from "./offices-service.js";
import { formatDate, getHoursAndMinutesFromMs, getMinutesFromMS, splitIntervalByIntervals } from "../utils/time-utils.js";
import recordsService from "./records-service.js";
import usersService from "./users-service.js";
import dotenv from "dotenv";
import authService from "./auth-service.js";
dotenv.config();

export const Messengers = {
    TELEGRAM: 'telegram',
}

const WEB_SITE_URL = process.env.CLIENT_URL;

class ChatBotService {
    async getClientRecords(messenger, chatId) {
        return await recordsService.getClientRecordsByChatId(messenger, chatId);
    }

    async getTelegramCode(chatId) {
        const user = await usersService.getUserViaMessenger(Messengers.TELEGRAM, chatId);

        if (user && user.telegramCode) {
            return `Чтобы привязать существующий аккаунт, зайдите в свою учетную запись <a href="${WEB_SITE_URL}">${WEB_SITE_URL}</a>, перейдите в раздел Профиль и укажите следующий код в разделе "Привязать телеграм": <b>${user.telegramCode}</b>`;
        } else {
            return `К сожалению, нет возможности привязать существующий аккаунт`;
        }
    }

    async deleteRecord(messenger, recordId) {
        return await recordsService.deleteRecordByIdViaMessenger(messenger, recordId);
    }

    async getMessagesWithResetPasswordLink(chatId) {
        const passwordLink = await authService.sendResetPasswordLink(undefined, undefined, chatId);

        const messages = [];

        messages.push(`Чтобы воспользоваться сайтом, необходим пароль. Чтобы создать новый пароль, перейдите по этой ссылке: <a href="${passwordLink}">${passwordLink}</a>`);
        messages.push(`В дальнейшем для входа в качестве логина используйте следующий идентификатор: <b>${chatId}</b>`);
        messages.push(`Наш сайт: <a href="${WEB_SITE_URL}">${WEB_SITE_URL}</a>`);

        return messages;
    }

    async registerUserFromChatBot(messenger, chatId, name, surname) {
        return await usersService.registerUserFromMessenger(messenger, chatId, name, surname);
    }

    async getSpecialistsByService(serviceId) {
        return await usersService.getSpecialistsByService(serviceId);
    }

    async getOffices() {
        return await officesService.getAllOffices();
    }

    async getServicesByOffice(officeId) {
        return await officesService.getServicesByOffice(officeId);
    }

    async saveOffice(chatId, officeId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);

        if (chatInfoDocument) {
            chatInfoDocument.officeId = officeId;

            return await chatInfoDocument.save();
        }

        return await chatBotModel.create({ chatId, officeId })
    }

    async saveService(chatId, serviceId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);

        if (chatInfoDocument) {
            chatInfoDocument.serviceId = serviceId;
            return await chatInfoDocument.save();
        }

        return await chatBotModel.create({ chatId, serviceId })
    }

    async saveSpecialist(chatId, specId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);
        if (chatInfoDocument) {
            chatInfoDocument.specId = specId;
            return await chatInfoDocument.save();
        }

        return await chatBotModel.create({ chatId, specId });
    }

    async saveDayBySchedule(chatId, scheduleId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);
        if (chatInfoDocument) {
            chatInfoDocument.scheduleId = scheduleId;
            return await chatInfoDocument.save();
        }

        return await chatBotModel.create({ chatId, scheduleId })
    }

    async getFreeTime(specId, serviceId, scheduleId) {
        const { daySchedule, serviceDuration } = await recordsService.getAvailableTimeIntervalsForServiceByScheduleId(specId, serviceId, scheduleId, Date.now() + 1000 * 60);

        const hasIntervals = daySchedule && daySchedule.freeIntervals && daySchedule.freeIntervals.length;

        return {
            freeTime: hasIntervals ? daySchedule.freeIntervals.map(interval => splitIntervalByIntervals(interval.from, interval.to, serviceDuration)).flat() : null,
            serviceDuration
        }
    }

    async clearData(chatId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);

        if (chatInfoDocument) {
            await chatInfoDocument.delete();
        }
    }

    async getChatInfo(chatId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);

        return ChatInfoDto.Convert(chatInfoDocument);
    }

    async getAvailableDaysForService(specId, serviceId) {
        const { days } = await recordsService.getAvailableDaysForService(specId, serviceId, Date.now() + 1000 * 60);
        return days;
    }

    async createRecord(messenger, chatId, serviceId, scheduleId, startTime) {
        return await recordsService.createRecordViaMessenger(messenger, chatId, serviceId, scheduleId, Number(startTime));
    }

    async _getChatInfoDocument(chatId) {
       return await chatBotModel.findOne({ chatId }).exec();
    }

    getRecordString(record) {
        return `Вы записаны на «${record.service.name}» ${formatDate(record.date, true)} в ${getHoursAndMinutesFromMs(record.startTime)} к мастеру ${record.specialist.name} ${record.specialist.surname}. Стоимость услуги ${record.service.cost}₽, длительность ~${Math.floor(getMinutesFromMS(record.service.duration))} минут.`;
    }
}

export default new ChatBotService()