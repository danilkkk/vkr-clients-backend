import ApiError from "../exceptions/api-error.js";
import RecordModel from "../models/record-model.js";
import RecordDto from "../dtos/record-dto.js";
import recordModel from "../models/record-model.js";
import servicesService from "./services-service.js";
import usersService from "./users-service.js";
import scheduleService from "./schedule-service.js";

class RecordsService {

    async getRecordsBySchedule(scheduleId) {
        return await RecordModel.find({ scheduleId }).exec();
    }

    async createRecord(clientId, serviceId, scheduleId, startTime) {
        const service = await servicesService.getServiceById(serviceId);

        const scheduleDocument = await scheduleService.getPopulatedScheduleDocumentById(scheduleId);

        const specId = scheduleDocument.userId;

        await checkIfSpecHasService(specId, serviceId);

        const otherRecords = await this.getRecordsBySchedule(scheduleId);

        if (!scheduleService.isTheRecordFit(scheduleDocument.patternId.intervals, otherRecords, startTime, service.duration)) {
            throw ApiError.BadRequest('Recording for the current time is not available');
        }

        const { _id: recordId } = await recordModel.create({clientId, startTime, specId, serviceId, scheduleId, ...service });

        const record = await recordModel.findById(recordId)
            .populate('clientId')
            .populate('specId')
            .populate('serviceId')
            .populate('scheduleId')
            .exec()

        return RecordDto.Convert(record);
    }

    async getAvailableDaysForService(specId, serviceId, from, to) {
       if (from < Date.now() || to < Date.now()) {
           throw ApiError.BadRequest('Date in the past');
       }

        await checkIfSpecHasService(specId, serviceId);

        const service = await servicesService.getServiceById(serviceId);

        const serviceDuration = service.duration;

        return await scheduleService.getFreeTimeForPeriod(specId, from, to,  serviceDuration);
    }

    async getClientRecords(clientId) {
        const records = await RecordModel.find({ clientId }).exec();
        return RecordDto.ConvertMany(records);
    }

    async deletePatternById(currentUser, id) {
        const patternDocument = await getPatternDocumentById(id);

        // TODO удалять паттерн, если он нигде не используется

        patternDocument.userId = undefined;
        await patternDocument.save();
    }
}

async function getPatternDocumentById(id) {
    const patternDocument = await getPatternDocumentByIdSafe(id);

    if (!patternDocument) {
        throw ApiError.NotFound(`Schedule pattern with id ${id} does not exist`);
    }

    return patternDocument;
}

async function getPatternDocumentByIdSafe(id) {
    return await schedulePatternModel.findById(id).exec();
}

async function checkIfSpecHasService(specId, serviceId) {
    const servicesBySpec = await usersService.getServicesBySpecialist(specId);

    if (!servicesBySpec.find(service => String(service.id) === serviceId)) {
        throw ApiError.BadRequest(`This service is not available from this specialist`);
    }
}

export default new RecordsService()