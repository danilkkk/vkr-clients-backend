import ApiError from "../exceptions/api-error.js";
import RecordModel from "../models/record-model.js";
import RecordDto from "../dtos/record-dto.js";
import recordModel from "../models/record-model.js";
import servicesService from "./services-service.js";
import usersService from "./users-service.js";
import scheduleService from "./schedule-service.js";
import rolesService from "./roles-service.js";
import Roles from "../models/role-model.js";
import logger from "../logger.js";
import moment from "moment";

class RecordsService {
    constructor() {
        logger.info('[RecordsService] initialization...');
    }

    async getRecordsCursor() {
        return RecordModel.find().populate('clientId')
            .populate('specId')
            .populate('serviceId')
            .populate('scheduleId')
            .cursor();
    }

    async getRecordsBySchedule(scheduleId) {
        return await RecordModel.find({ scheduleId }).exec();
    }

    async setPaidStatus(currentUser, recordId) {
        rolesService.checkPermission(currentUser, Roles.SELF_EMPLOYED_SPEC);

        await RecordModel.findByIdAndUpdate(recordId, { paid: true });
    }

    async getProfitForPeriod(currentUser, specId, from, to) {
        if (currentUser.id !== specId) {
            const spec = await usersService.getUserById(specId);

            rolesService.checkIfHasMorePriority(currentUser, spec.roles, Roles.EMPLOYEE);
        }

        const schedulesOnPeriod = await scheduleService.getScheduleForPeriod(specId, from, to);

        const scheduleIds = schedulesOnPeriod.map(s => s.id);

        const records = await RecordModel.find({ paid: true, scheduleId: { $in: scheduleIds } }).exec();

        return records.reduce((sum, current) => sum + current.cost, 0);
    }

    async editRecordById(currentUser, clientId, recordId, changes) {
        const record = await getRecordDocumentById(recordId);

        if (currentUser.id !== record.userId) {
            rolesService.checkPermission(currentUser, Roles.EMPLOYEE)
        }

        const scheduleId = record.scheduleId;

        if (changes.startTime || changes.duration) {
            const scheduleDocument = await scheduleService.getPopulatedScheduleDocumentById(scheduleId);

            const otherRecords = await this.getRecordsBySchedule(scheduleId);

            const startTime = changes.from || record.from;
            const duration = changes.duration || record.duration;

            if (!scheduleService.isTheRecordFit(scheduleDocument.patternId.intervals, otherRecords, startTime, duration)) {
                throw ApiError.BadRequest('Recording for the current time is not available');
            }

            record.startTime = startTime;
            record.duration = duration;
        }

        if (changes.cost && changes.cost >= 0) {
            record.cost = changes.cost;
        }

        if (changes.paid) {
            record.paid = changes.paid;
        }

        return await this.getRecordById(currentUser, recordId);
    }

    async getRecordById(currentUser, recordId) {
        const record = await getRecordDocumentById(recordId);

        if (currentUser.id !== record.userId) {
            rolesService.checkPermission(currentUser, Roles.EMPLOYEE)
        }

        return RecordDto.Convert(record);
    }

    async createRecordByTelegramId(telegramId, serviceId, scheduleId, startTime) {
        const user = await usersService.getUserByTelegramId(telegramId);
        return await this.createRecord(user.id, serviceId, scheduleId, startTime);
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

        const { _id: recordId } = await recordModel.create({ clientId, startTime, specId, serviceId, scheduleId, ...service });

        const record = await getRecordDocumentByIdSafe(recordId);

        return RecordDto.Convert(record);
    }

    async getAvailableTimeIntervalsForServiceByScheduleId(specId, serviceId, scheduleId, from) {
        const { days, serviceDuration } = await this.getAvailableDaysForService(specId, serviceId, from);
        return {
            daySchedule: days.find(record => String(record.id) === scheduleId),
            serviceDuration
        };
    }

    async getAvailableDaysForService(specId, serviceId, from, to) {
       if (from < Date.now() || to && to < Date.now()) {
           throw ApiError.BadRequest('Date in the past');
       }

        await checkIfSpecHasService(specId, serviceId);

        const service = await servicesService.getServiceById(serviceId);

        const serviceDuration = service.duration;

        const days = await scheduleService.getFreeTimeForPeriod(specId, from, to, serviceDuration);

        return {
            days,
            serviceDuration
        }
    }

    async getClientRecordsUncheck(clientId, specId, withUser = false) {
        const data = {};

        if (clientId) {
            data.clientId = clientId;
        } else {
            data.specId = specId;
        }

        const records = await RecordModel.find(data).populate('clientId')
            .populate('specId')
            .populate('serviceId')
            .populate('scheduleId')
            .exec();

        return {
            records: RecordDto.ConvertMany(records),
            user: withUser ? await usersService.getUserById(clientId || specId) : null,
        }
    }

    async getClientRecordsByTelegramId(telegramId) {
        const user = await usersService.getUserByTelegramId(telegramId);

        if (user) {
            return (await this.getClientRecordsUncheck(user.id)).records;
        }
    }

    async getClientRecords(currentUser, clientId) {
        if (currentUser.id !== clientId) {
            rolesService.checkPermission(currentUser, Roles.EMPLOYEE);
        }

        return await this.getClientRecordsUncheck(clientId, null, currentUser.id !== clientId);
    }

    async getRecordsBySpec(currentUser, specId) {
        if (currentUser.id !== specId) {
            rolesService.checkPermission(currentUser, Roles.EMPLOYEE);
        }

        return await this.getClientRecordsUncheck(null, specId, currentUser.id !== specId);
    }

    async deleteRecordByIdByBot(id) {
        const record = await RecordModel.findById(id).exec();

        if (record) {
            await record.delete();
            return RecordDto.Convert(record);
        }

        return {};
    }

    async deleteRecordById(currentUser, id) {
        const record = await RecordModel.findById(id).exec();

        if (record.clientId !== currentUser.id) {
            rolesService.checkPermission(currentUser, Roles.EMPLOYEE);
        }

        await record.delete();

        return RecordDto.Convert(record);
    }
}

async function getRecordDocumentById(id) {
    const recordDocument = await getRecordDocumentByIdSafe(id);

    if (!recordDocument) {
        throw ApiError.NotFound(`Record with id ${id} does not exist`);
    }

    return recordDocument;
}

async function getRecordDocumentByIdSafe(id) {
    return await recordModel.findById(id)
        .populate('clientId')
        .populate('specId')
        .populate('serviceId')
        .populate('scheduleId')
        .exec()
}

async function checkIfSpecHasService(specId, serviceId) {
    const servicesBySpec = await usersService.getServicesBySpecialist(specId);

    if (!servicesBySpec.find(service => String(service.id) === String(serviceId))) {
        throw ApiError.BadRequest(`This service is not available from this specialist`);
    }
}

export default new RecordsService()