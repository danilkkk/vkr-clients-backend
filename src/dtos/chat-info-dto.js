export default class ChatInfoDto {
    id;
    chatId;
    officeId;
    serviceId;
    specId;
    scheduleId;

    constructor({ _id, chatId, officeId, serviceId, specId, scheduleId }) {
        this.id = _id;
        this.chatId = chatId;
        this.officeId = officeId;
        this.serviceId = serviceId;
        this.specId = specId;
        this.scheduleId = scheduleId;
    }

    static Convert(chatInfoDocument) {
        if (!chatInfoDocument) {
            return undefined;
        }

        return new ChatInfoDto(chatInfoDocument);
    }

    static ConvertMany(chatInfoDocuments) {
        return chatInfoDocuments.map(ChatInfoDto.Convert);
    }
}