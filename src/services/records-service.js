import ApiError from "../exceptions/api-error.js";
import RecordModel from "../models/record-model.js";
import RecordDto from "../dtos/record-dto.js";
import recordModel from "../models/record-model.js";
import servicesService from "./services-service.js";
import usersService from "./users-service.js";
import moment from "moment";
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

// function isTheRecordFit(freeIntervals, startTime, duration, endTime = startTime + duration) {
//     return !!freeIntervals.find(interval => interval.from <= startTime && interval.to >= endTime);
// }
//
// function getAvailableTime(intervals, records, duration) {
//     return getFreeIntervals(intervals, records)
//         .filter(interval => interval.duration >= duration);
// }
//
// function getFreeIntervals(intervals, records) {
//     if (records.length === 0) {
//         return intervals.map(interval => ({
//             from: interval.from,
//             to: interval.to,
//             duration: interval.to - interval.from,
//         }));
//     }
//
//     console.log(records);
//     // преобразуем и сортируем массив записей по возрастанию
//     records = records.map(r => ({
//         from: r.startTime,
//         to: r.startTime + r.duration,
//     })).sort((r1, r2) => r1.from - r2.from);
//
//     console.log(records);
//
//     const freeIntervals = [];
//
//     let from;
//     let to;
//     let duration;
//
//     for (let i = 0; i < intervals.length; i++) {
//         const recordsInCurrentInterval = getRecordsInCurrentInterval(intervals[i], records);
//
//         from = intervals[i].from;
//
//         for (let j = 0; j < recordsInCurrentInterval.length; j++) {
//             to = recordsInCurrentInterval[j].from;
//
//             duration = to - from;
//
//             if (duration > 0) {
//                 freeIntervals.push({
//                     from,
//                     to,
//                     duration
//                 })
//             }
//
//             from = recordsInCurrentInterval[j].to;
//         }
//
//         to = intervals[i].to;
//         duration = to - from;
//
//         if (duration > 0) {
//             freeIntervals.push({
//                 from,
//                 to,
//                 duration
//             })
//         }
//     }
//
//     return freeIntervals;
// }
//
// function getRecordsInCurrentInterval(interval, records) {
//     return records.filter(record => record.from >= interval.from && record.to <= interval.to);
// }

function dateToString(date) {
    return moment(date).format('YYYY-MM-DD');
}

async function checkIfSpecHasService(specId, serviceId) {
    const servicesBySpec = await usersService.getServicesBySpecialist(specId);

    if (!servicesBySpec.find(service => String(service.id) === serviceId)) {
        throw ApiError.BadRequest(`This service is not available from this specialist`);
    }
}

export default new RecordsService()