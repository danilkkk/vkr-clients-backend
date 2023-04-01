import UserDto from "./user-dto.js";
import SpecialistDto from "./specialist-dto.js";

export default class RecordDto {
    id;
    service;
    specialist;
    client;
    cost;
    startTime;
    duration;
    date;

    constructor({ _id, clientId, scheduleId, specId, cost, startTime, duration, serviceId }) {
        this.id = _id;
        this.client = UserDto.Convert(clientId);
        this.specialist = SpecialistDto.Convert(specId)
        this.date = scheduleId.date;
        this.cost = cost;
        this.startTime = startTime;
        this.duration = duration;
        this.service = serviceId;
    }

    static Convert(recordDocument) {
        if (!recordDocument) {
            return undefined;
        }

        return new RecordDto(recordDocument);
    }

    static ConvertMany(recordDocuments) {
        return recordDocuments.map(RecordDto.Convert);
    }
}