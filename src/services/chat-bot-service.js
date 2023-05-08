import chatBotModel from "../models/chat-bot-model.js";
import ChatInfoDto from "../dtos/chat-info-dto.js";

class ChatBotService {
    async saveOffice(chatId, officeId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);
        if (chatInfoDocument) {
            chatInfoDocument.officeId = officeId;
            await chatInfoDocument.save();
        } else {
            await chatBotModel.create({ chatId, officeId })
        }
    }

    async saveService(chatId, serviceId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);
        if (chatInfoDocument) {
            chatInfoDocument.serviceId = serviceId;
            await chatInfoDocument.save();
        } else {
            await chatBotModel.create({ chatId, serviceId })
        }
    }

    async saveSpecialist(chatId, specId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);
        if (chatInfoDocument) {
            chatInfoDocument.specId = specId;
            await chatInfoDocument.save();
        } else {
            await chatBotModel.create({ chatId, specId })
        }
    }

    async saveDayBySchedule(chatId, scheduleId) {
        const chatInfoDocument = await this._getChatInfoDocument(chatId);
        if (chatInfoDocument) {
            chatInfoDocument.scheduleId = scheduleId;
            await chatInfoDocument.save();
        } else {
            await chatBotModel.create({ chatId, scheduleId })
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

    async _getChatInfoDocument(chatId) {
       return await chatBotModel.findOne({ chatId }).exec();
    }
}

export default new ChatBotService()